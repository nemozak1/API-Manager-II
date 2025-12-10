export class OBPErrorBase extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "OBPError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, OBPErrorBase.prototype);
  }
}

export class OBPRequestError extends OBPErrorBase {
  code: string;
  message: string;
  obpErrorCode: string;

  constructor(code: number, message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = "OBPRequestError";
    this.code = code.toString();
    this.message = message;
    Object.setPrototypeOf(this, OBPRequestError.prototype);
    this.obpErrorCode = this.getObpErrorCode();
  }

  getObpErrorCode(): string {
    const match = this.message.match(/OBP-\d+/);
    return match ? match[0] : "UNKNOWN_ERROR";
  }
}
