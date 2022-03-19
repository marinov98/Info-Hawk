export type THAError = {
  msg: string;
  src: string;
  status: number;
};

export type Maybe<T> = T | THAError;
