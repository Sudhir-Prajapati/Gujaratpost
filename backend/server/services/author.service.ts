import { AuthorRepository } from "@/server/repositories/author.repository";

export const AuthorService = {
  async getActiveAuthors() {
    return AuthorRepository.findAllActive();
  },

  async getAuthorBySlug(slug: string) {
    return AuthorRepository.findBySlug(slug);
  },
};
