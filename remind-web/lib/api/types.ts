/**
 * Tipos base de integração com a API Spring Boot.
 * Hooks de domínio (TanStack Query) ficam na Spec 04.
 */

/** Paginação no formato Spring `Page<T>`. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}

/** Erro padronizado vindo da camada `client`. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  /**
   * Bug conhecido (PRD §3 #6): credenciais erradas retornam 500 em vez de 401.
   * Tratar 500 no fluxo de login como credencial inválida até correção.
   */
  get isServerError() {
    return this.status >= 500;
  }
}
