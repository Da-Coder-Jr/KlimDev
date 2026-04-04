import * as vscode from "vscode";
import * as https from "https";
import * as http from "http";

export interface NimMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NimCompletionOptions {
  messages: NimMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stop?: string[];
  stream?: boolean;
}

export interface NimStreamChunk {
  id: string;
  choices: {
    delta: { content?: string; role?: string };
    finish_reason: string | null;
    index: number;
  }[];
}

export interface NimResponse {
  id: string;
  choices: {
    message: NimMessage;
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class NimClient {
  private getConfig() {
    const config = vscode.workspace.getConfiguration("klimdev");
    return {
      apiKey: config.get<string>("nvidia.apiKey") || process.env.NVIDIA_API_KEY || "",
      baseUrl: config.get<string>("nvidia.baseUrl") || "https://integrate.api.nvidia.com/v1",
      chatModel: config.get<string>("nvidia.chatModel") || "meta/llama-3.1-70b-instruct",
      completionModel: config.get<string>("nvidia.completionModel") || "qwen/qwen2.5-coder-32b-instruct",
      maxTokens: config.get<number>("maxTokens") || 4096,
      temperature: config.get<number>("temperature") || 0.3,
    };
  }

  private getApiKey(): string {
    const key = this.getConfig().apiKey;
    if (!key) {
      vscode.window
        .showErrorMessage(
          "NVIDIA NIM API key not set. Please configure it in settings.",
          "Open Settings"
        )
        .then((choice) => {
          if (choice === "Open Settings") {
            vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "klimdev.nvidia.apiKey"
            );
          }
        });
      throw new Error("NVIDIA NIM API key not configured");
    }
    return key;
  }

  async complete(options: NimCompletionOptions): Promise<NimResponse> {
    const config = this.getConfig();
    const apiKey = this.getApiKey();

    const body = JSON.stringify({
      model: options.model || config.chatModel,
      messages: options.messages,
      max_tokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature ?? config.temperature,
      stop: options.stop,
      stream: false,
    });

    return this.request<NimResponse>("/chat/completions", body, apiKey, config.baseUrl);
  }

  async *stream(
    options: NimCompletionOptions,
    cancelToken?: vscode.CancellationToken
  ): AsyncGenerator<string, void, unknown> {
    const config = this.getConfig();
    const apiKey = this.getApiKey();

    const body = JSON.stringify({
      model: options.model || config.chatModel,
      messages: options.messages,
      max_tokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature ?? config.temperature,
      stop: options.stop,
      stream: true,
    });

    const url = new URL(config.baseUrl + "/chat/completions");
    const isHttps = url.protocol === "https:";
    const transport = isHttps ? https : http;

    const requestOptions: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
      },
    };

    yield* await new Promise<AsyncGenerator<string, void, unknown>>(
      (resolve, reject) => {
        const req = transport.request(requestOptions, (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            let errorBody = "";
            res.on("data", (chunk: Buffer) => {
              errorBody += chunk.toString();
            });
            res.on("end", () => {
              reject(
                new Error(
                  `NVIDIA NIM API error (${res.statusCode}): ${errorBody}`
                )
              );
            });
            return;
          }

          const generator = (async function* () {
            let buffer = "";

            const chunks: string[] = [];
            let resolveChunk: (() => void) | null = null;
            let done = false;

            res.on("data", (chunk: Buffer) => {
              chunks.push(chunk.toString());
              if (resolveChunk) {
                resolveChunk();
                resolveChunk = null;
              }
            });

            res.on("end", () => {
              done = true;
              if (resolveChunk) {
                resolveChunk();
                resolveChunk = null;
              }
            });

            res.on("error", (err) => {
              done = true;
              if (resolveChunk) {
                resolveChunk();
                resolveChunk = null;
              }
            });

            while (!done || chunks.length > 0) {
              if (cancelToken?.isCancellationRequested) {
                req.destroy();
                return;
              }

              if (chunks.length === 0) {
                await new Promise<void>((r) => {
                  resolveChunk = r;
                });
                continue;
              }

              buffer += chunks.shift()!;
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
                const data = trimmed.slice(6);
                if (data === "[DONE]") return;

                try {
                  const parsed: NimStreamChunk = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;
                  if (content) {
                    yield content;
                  }
                } catch {
                  // Skip malformed chunks
                }
              }
            }
          })();

          resolve(generator);
        });

        req.on("error", reject);

        if (cancelToken) {
          cancelToken.onCancellationRequested(() => {
            req.destroy();
          });
        }

        req.write(body);
        req.end();
      }
    );
  }

  async completeCode(
    prefix: string,
    suffix: string,
    language: string,
    cancelToken?: vscode.CancellationToken
  ): Promise<string> {
    const config = this.getConfig();
    const apiKey = this.getApiKey();

    const messages: NimMessage[] = [
      {
        role: "system",
        content: `You are an expert code completion engine. You complete code snippets in ${language}. Output ONLY the code that goes between the prefix and suffix. No explanations, no markdown, no backticks. Just raw code.`,
      },
      {
        role: "user",
        content: `Complete the code between <prefix> and <suffix> tags. Output ONLY the completion code, nothing else.\n\n<prefix>${prefix}</prefix>\n<suffix>${suffix}</suffix>`,
      },
    ];

    const body = JSON.stringify({
      model: config.completionModel,
      messages,
      max_tokens: 256,
      temperature: 0.1,
      stop: ["\n\n\n", "</suffix>", "<prefix>"],
      stream: false,
    });

    const resp = await this.request<NimResponse>(
      "/chat/completions",
      body,
      apiKey,
      config.baseUrl
    );
    return resp.choices[0]?.message?.content?.trim() || "";
  }

  private request<T>(
    path: string,
    body: string,
    apiKey: string,
    baseUrl: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl + path);
      const isHttps = url.protocol === "https:";
      const transport = isHttps ? https : http;

      const req = transport.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(
                new Error(
                  `NVIDIA NIM API error (${res.statusCode}): ${data}`
                )
              );
              return;
            }
            try {
              resolve(JSON.parse(data) as T);
            } catch {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          });
        }
      );

      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }
}

// Singleton
let client: NimClient | undefined;

export function getNimClient(): NimClient {
  if (!client) {
    client = new NimClient();
  }
  return client;
}
