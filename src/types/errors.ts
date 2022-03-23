export type THAError = {
  msg: string;
  src: string;
  status: number;
};

export type Optional<T> = T | null | undefined;
export type Maybe<T> = T | THAError;
