export type UserRole = 'admin' | 'gerente' | 'funcionario';

export type Permission =
  | 'ver_visao_geral'
  | 'ver_atendimento'
  | 'ver_reputacao'
  | 'responder_reputacao'
  | 'ver_todos_veiculos'
  | 'ver_veiculos_setor'
  | 'ver_todas_tarefas'
  | 'ver_proprias_tarefas'
  | 'ver_funcionarios'
  | 'gerenciar_funcionarios'
  | 'gerenciar_veiculos'
  | 'gerenciar_tarefas'
  | 'ver_configuracoes'
  | 'gerenciar_integracoes'
  | 'ver_relatorios';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  funcionario: 'Funcionário',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso completo à operação, equipe, reputação, integrações e configurações.',
  gerente: 'Acompanha a operação, a equipe e a reputação, sem acesso às chaves e integrações sensíveis.',
  funcionario: 'Vê somente o que precisa para executar o próprio trabalho e as tarefas do seu setor.',
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'ver_visao_geral',
    'ver_atendimento',
    'ver_reputacao',
    'responder_reputacao',
    'ver_todos_veiculos',
    'ver_veiculos_setor',
    'ver_todas_tarefas',
    'ver_proprias_tarefas',
    'ver_funcionarios',
    'gerenciar_funcionarios',
    'gerenciar_veiculos',
    'gerenciar_tarefas',
    'ver_configuracoes',
    'gerenciar_integracoes',
    'ver_relatorios',
  ],
  gerente: [
    'ver_visao_geral',
    'ver_atendimento',
    'ver_reputacao',
    'responder_reputacao',
    'ver_todos_veiculos',
    'ver_veiculos_setor',
    'ver_todas_tarefas',
    'ver_proprias_tarefas',
    'ver_funcionarios',
    'gerenciar_veiculos',
    'gerenciar_tarefas',
    'ver_relatorios',
  ],
  funcionario: [
    'ver_veiculos_setor',
    'ver_proprias_tarefas',
  ],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  ver_visao_geral: 'Visão geral da oficina',
  ver_atendimento: 'Central de atendimento',
  ver_reputacao: 'Central de reputação',
  responder_reputacao: 'Responder Google, Instagram e Reclame Aqui',
  ver_todos_veiculos: 'Todos os veículos',
  ver_veiculos_setor: 'Veículos do próprio setor',
  ver_todas_tarefas: 'Todas as tarefas',
  ver_proprias_tarefas: 'Próprias tarefas',
  ver_funcionarios: 'Lista de funcionários',
  gerenciar_funcionarios: 'Cadastrar e editar funcionários',
  gerenciar_veiculos: 'Cadastrar e editar veículos',
  gerenciar_tarefas: 'Distribuir e alterar tarefas',
  ver_configuracoes: 'Configurações do sistema',
  gerenciar_integracoes: 'WhatsApp, IA e integrações',
  ver_relatorios: 'Relatórios e indicadores',
};

export function hasPermission(role: UserRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}
