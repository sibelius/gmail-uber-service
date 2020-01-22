/* @flow */
export type ThreadResponseGet =  {
  data: Thread,
};

export type Thread =  {
  id: string,
  historyId: string,
  messages: Messages[],
};

type Messages =  {
  id: string,
  threadId: string,
  labelIds: string[],
  snippet: string,
  historyId: string,
  internalDate: string,
  payload: Payload,
  sizeEstimate: number,
};

type Payload =  {
  partId: string,
  mimeType: string,
  filename: string,
  headers: Headers[],
  body: Body,
  parts: Parts[],
};

type Parts =  {
  partId: string,
  mimeType: string,
  filename: string,
  headers: Headers[],
  body: BodyPart,
};

type Headers =  {
  name: string,
  value: string,
};

type Body =  {
  size: number,
  data?: string,
};

type BodyPart =  {
  attachmentId?: string,
  size: number,
  data?: string,
  filename?: string,
};
