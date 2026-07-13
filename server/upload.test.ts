import { describe, it, expect, beforeAll } from "vitest";
import { storagePut } from "./storage";

describe("Image Upload System", () => {
  it("should upload image to S3 and return URL", async () => {
    // Criar buffer de imagem de teste (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const fileName = `test-upload-${Date.now()}.png`;

    // Fazer upload
    const result = await storagePut(fileName, testImageBuffer, "image/png");

    // Verificar se retornou URL
    expect(result).toHaveProperty("url");
    expect(result.url).toContain(fileName);
    expect(result.url).toMatch(/^https?:\/\//);
  });

  it("should handle different image formats", async () => {
    const testImageBuffer = Buffer.from("fake-jpeg-data");
    const fileName = `test-jpeg-${Date.now()}.jpg`;

    const result = await storagePut(fileName, testImageBuffer, "image/jpeg");

    expect(result).toHaveProperty("url");
    expect(result.url).toContain(fileName);
  });
});
