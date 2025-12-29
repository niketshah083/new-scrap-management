export class FileConstants {
  static FILE_EXTENSION = {
    PDF: '.pdf',
    XLSX: '.xlsx',
    JPG: '.jpg',
    JPEG: '.jpeg',
    PNG: '.png',
    CSV: '.csv',
    XLS: '.xls',
    XML: '.xml',
  };

  static FILE_TYPE = {
    IMAGE: [FileConstants.FILE_EXTENSION.JPEG, FileConstants.FILE_EXTENSION.JPG, FileConstants.FILE_EXTENSION.PNG],
    EXCEL: [FileConstants.FILE_EXTENSION.XLSX, FileConstants.FILE_EXTENSION.XLS, FileConstants.FILE_EXTENSION.CSV],
    PDF: [FileConstants.FILE_EXTENSION.PDF],
    XML: [FileConstants.FILE_EXTENSION.XML],
  };

  static FILE_SIZE = {
    TEN_MB: 10 * 1024 * 1024,
  };

  static BANK_CONFIG = {
    MAX_FILE_SIZE: 30 * 1024 * 1024, // MB -- 30MB
  };
}
