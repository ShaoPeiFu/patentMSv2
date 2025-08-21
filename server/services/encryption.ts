import crypto from "crypto";
import forge from "node-forge";

export interface EncryptionKey {
  id: string;
  algorithm: string;
  key: string;
  iv?: string;
  publicKey?: string;
  privateKey?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface EncryptedData {
  encrypted: string;
  keyId: string;
  algorithm: string;
  iv?: string;
  signature?: string;
}

export class EncryptionService {
  private keys: Map<string, EncryptionKey> = new Map();
  private readonly masterKey: string;

  constructor() {
    // 从环境变量获取主密钥，如果没有则生成一个
    this.masterKey =
      process.env.MASTER_ENCRYPTION_KEY || this.generateMasterKey();
    console.log("🔐 加密服务已初始化");
  }

  /**
   * 生成主密钥
   */
  private generateMasterKey(): string {
    const key = crypto.randomBytes(32).toString("hex");
    console.log("⚠️ 生成了新的主密钥，建议设置环境变量 MASTER_ENCRYPTION_KEY");
    return key;
  }

  /**
   * 生成AES密钥
   */
  generateAESKey(keySize: number = 256): EncryptionKey {
    const keyId = `aes_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const key = crypto.randomBytes(keySize / 8);
    const iv = crypto.randomBytes(16);

    const encryptionKey: EncryptionKey = {
      id: keyId,
      algorithm: `AES-${keySize}`,
      key: key.toString("hex"),
      iv: iv.toString("hex"),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后过期
    };

    this.keys.set(keyId, encryptionKey);
    return encryptionKey;
  }

  /**
   * 生成RSA密钥对
   */
  generateRSAKeyPair(keySize: number = 2048): EncryptionKey {
    const keyId = `rsa_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // 生成RSA密钥对
    const rsa = forge.pki.rsa;
    const keypair = rsa.generateKeyPair({ bits: keySize });

    const encryptionKey: EncryptionKey = {
      id: keyId,
      algorithm: `RSA-${keySize}`,
      key: keyId, // 使用keyId作为标识
      publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
      privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
    };

    this.keys.set(keyId, encryptionKey);
    return encryptionKey;
  }

  /**
   * 使用AES加密数据
   */
  encryptWithAES(data: string, keyId: string): EncryptedData {
    const key = this.keys.get(keyId);
    if (!key || !key.iv) {
      throw new Error("加密密钥不存在或无效");
    }

    try {
      const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(key.key, "hex"),
        Buffer.from(key.iv, "hex")
      );

      let encrypted = cipher.update(data, "utf8", "hex");
      encrypted += cipher.final("hex");

      return {
        encrypted,
        keyId,
        algorithm: key.algorithm,
        iv: key.iv,
      };
    } catch (error) {
      console.error("AES加密失败:", error);
      throw new Error(
        `AES加密失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 使用AES解密数据
   */
  decryptWithAES(encryptedData: EncryptedData): string {
    const key = this.keys.get(encryptedData.keyId);
    if (!key || !encryptedData.iv) {
      throw new Error("解密密钥不存在或无效");
    }

    try {
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(key.key, "hex"),
        Buffer.from(encryptedData.iv, "hex")
      );

      let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("AES解密失败:", error);
      throw new Error(
        `AES解密失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 使用RSA加密数据
   */
  encryptWithRSA(data: string, keyId: string): EncryptedData {
    const key = this.keys.get(keyId);
    if (!key || !key.publicKey) {
      throw new Error("RSA公钥不存在或无效");
    }

    const publicKey = forge.pki.publicKeyFromPem(key.publicKey);
    const encrypted = publicKey.encrypt(data, "RSAES-PKCS1-V1_5");

    return {
      encrypted: forge.util.encode64(encrypted),
      keyId,
      algorithm: key.algorithm,
    };
  }

  /**
   * 使用RSA解密数据
   */
  decryptWithRSA(encryptedData: EncryptedData): string {
    const key = this.keys.get(encryptedData.keyId);
    if (!key || !key.privateKey) {
      throw new Error("RSA私钥不存在或无效");
    }

    const privateKey = forge.pki.privateKeyFromPem(key.privateKey);
    const encrypted = forge.util.decode64(encryptedData.encrypted);
    const decrypted = privateKey.decrypt(encrypted, "RSAES-PKCS1-V1_5");

    return decrypted;
  }

  /**
   * 生成数字签名
   */
  signData(data: string, keyId: string): string {
    const key = this.keys.get(keyId);
    if (!key || !key.privateKey) {
      throw new Error("签名私钥不存在或无效");
    }

    const privateKey = forge.pki.privateKeyFromPem(key.privateKey);
    const md = forge.md.sha256.create();
    md.update(data, "utf8");
    const signature = privateKey.sign(md);

    return forge.util.encode64(signature);
  }

  /**
   * 验证数字签名
   */
  verifySignature(data: string, signature: string, keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (!key || !key.publicKey) {
      throw new Error("验证公钥不存在或无效");
    }

    try {
      const publicKey = forge.pki.publicKeyFromPem(key.publicKey);
      const md = forge.md.sha256.create();
      md.update(data, "utf8");
      const sig = forge.util.decode64(signature);

      return publicKey.verify(md.digest().bytes(), sig);
    } catch (error) {
      return false;
    }
  }

  /**
   * 轮换密钥
   */
  rotateKey(oldKeyId: string, newAlgorithm: string): EncryptionKey {
    const oldKey = this.keys.get(oldKeyId);
    if (!oldKey) {
      throw new Error("旧密钥不存在");
    }

    let newKey: EncryptionKey;

    if (newAlgorithm.startsWith("AES")) {
      const keySize = parseInt(newAlgorithm.split("-")[1]);
      newKey = this.generateAESKey(keySize);
    } else if (newAlgorithm.startsWith("RSA")) {
      const keySize = parseInt(newAlgorithm.split("-")[1]);
      newKey = this.generateRSAKeyPair(keySize);
    } else {
      throw new Error("不支持的加密算法");
    }

    // 标记旧密钥为过期
    oldKey.expiresAt = new Date();

    return newKey;
  }

  /**
   * 获取所有密钥
   */
  getAllKeys(): EncryptionKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * 清理过期密钥
   */
  cleanupExpiredKeys(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [keyId, key] of this.keys.entries()) {
      if (key.expiresAt < now) {
        this.keys.delete(keyId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期密钥`);
    }

    return cleanedCount;
  }

  /**
   * 加密敏感字段
   */
  encryptSensitiveField(
    value: string,
    algorithm: string = "AES-256"
  ): EncryptedData {
    try {
      if (algorithm.startsWith("AES")) {
        const key = this.generateAESKey(256);
        return this.encryptWithAES(value, key.id);
      } else if (algorithm.startsWith("RSA")) {
        const key = this.generateRSAKeyPair(2048);
        return this.encryptWithRSA(value, key.id);
      } else {
        throw new Error("不支持的加密算法");
      }
    } catch (error) {
      console.error("加密敏感字段失败:", error);
      throw new Error(
        `加密失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }

  /**
   * 解密敏感字段
   */
  decryptSensitiveField(encryptedData: EncryptedData): string {
    try {
      if (encryptedData.algorithm.startsWith("AES")) {
        return this.decryptWithAES(encryptedData);
      } else if (encryptedData.algorithm.startsWith("RSA")) {
        return this.decryptWithRSA(encryptedData);
      } else {
        throw new Error("不支持的加密算法");
      }
    } catch (error) {
      console.error("解密敏感字段失败:", error);
      throw new Error(
        `解密失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  }
}

// 导出单例实例
export const encryptionService = new EncryptionService();
