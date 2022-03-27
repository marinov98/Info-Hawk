export type IHError = {
  msg: string;
  src: string;
  status: number;
};

export type Optional<T> = T | null | undefined;
export type Maybe<T> = T | IHError;
