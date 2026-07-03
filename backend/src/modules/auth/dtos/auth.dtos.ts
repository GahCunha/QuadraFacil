export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export type AuthResponse = {
  token: string;
  user: AuthUserResponse;
};
