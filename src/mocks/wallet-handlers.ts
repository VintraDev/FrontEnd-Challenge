import { http, HttpResponse } from 'msw';
import { walletInputSchema } from '@/contracts/wallets';
import { sessionFrom } from './auth-handlers';
import { readWallets, saveWallet } from './db/wallets';
import { readScenario } from './scenarios/catalog';

const error = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });
async function save(request: Request, walletId?: string) {
  try {
    const session = await sessionFrom(request);
    if (!session) return error(401, 'SESSION_EXPIRED', 'Entre para acessar suas carteiras.');
    const input = walletInputSchema.safeParse(await request.json());
    if (!input.success)
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Confira os dados da carteira.',
            fieldErrors: input.error.flatten().fieldErrors,
          },
        },
        { status: 422 },
      );
    if (readScenario().wallets === 'http-500')
      return error(500, 'STORE_ERROR', 'Não foi possível salvar a carteira.');
    return HttpResponse.json(await saveWallet(session.user.id, input.data, walletId), {
      status: walletId ? 200 : 201,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND')
      return error(404, 'NOT_FOUND', 'Carteira não encontrada.');
    if (err instanceof Error && err.message === 'CONFLICT')
      return error(409, 'CONFLICT', 'Já existe uma carteira nesta posição.');
    return error(500, 'STORE_ERROR', 'Não foi possível salvar a carteira.');
  }
}
export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    try {
      const session = await sessionFrom(request);
      return session
        ? HttpResponse.json({ items: await readWallets(session.user.id) })
        : error(401, 'SESSION_EXPIRED', 'Entre para acessar suas carteiras.');
    } catch {
      return error(500, 'STORE_ERROR', 'Não foi possível carregar as carteiras.');
    }
  }),
  http.post('/api/wallets', ({ request }) => save(request)),
  http.patch('/api/wallets/:walletId', ({ request, params }) =>
    save(request, String(params.walletId)),
  ),
];
