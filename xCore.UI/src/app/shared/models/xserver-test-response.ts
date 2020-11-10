export class XServerTestResponse {
  constructor(success: boolean, resultMessage: string) {
    this.success = success;
    this.resultMessage = resultMessage;
  }

  public success: boolean;
  public resultMessage: string;
}
