# Project Ontology — Ubiquitous Language

**Created**: 2026-07-01
**Last Updated**: 2026-07-01

## Domain Glossary

| Termo | Definição | Bounded Context |
|-------|-----------|-----------------|
| Psicólogo (Psychologist) | Usuário profissional que gerencia pacientes e questionários. Único perfil autorizado ao login com Google. | Autenticação / Cadastro |
| Paciente (Patient) | Usuário vinculado a um psicólogo; não pode usar o login com Google. | Autenticação / Cadastro |
| Identidade Google | Associação entre uma conta Google (identificador único e email) e uma conta de psicólogo no ReMind. | Autenticação |
| ID Token | Token assinado emitido pelo Google que comprova a identidade do usuário; validado pelo backend. | Autenticação |
| Vínculo de Conta | Ato de associar uma Identidade Google a uma conta de psicólogo já existente. | Autenticação |
| Conta Pendente | Conta de psicólogo criada via Google apenas com nome+email, sem perfil completo. | Cadastro |
| Perfil Incompleto | Estado de uma conta que ainda não possui CPF, telefone e endereço obrigatórios. | Cadastro |
| Conclusão de Perfil | Envio dos dados obrigatórios que torna uma conta pendente uma conta completa. | Cadastro |
| Token de Acesso da Aplicação | JWT próprio do ReMind emitido após autenticação, no mesmo formato do login por senha. | Autenticação |

## Bounded Contexts

| Contexto | Descrição | Termos-chave |
|----------|-----------|--------------|
| Autenticação | Verificação de identidade e emissão de tokens de acesso. | ID Token, Identidade Google, Vínculo de Conta, Token de Acesso da Aplicação |
| Cadastro | Criação e completude de contas de psicólogo. | Conta Pendente, Perfil Incompleto, Conclusão de Perfil |

## Conceptual Mapping

Uma **Identidade Google** verificada resolve para uma conta de **Psicólogo** —
existente (via **Vínculo de Conta**) ou nova (**Conta Pendente** com **Perfil
Incompleto**). A **Conclusão de Perfil** transforma a conta pendente em completa.
