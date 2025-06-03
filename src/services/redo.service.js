import pool from '../config/database.js';

export class RedoService {
  async executeRedo() {
    const client = await pool.connect();
    let operationsFailed = 0;
    let logEntriesExist = false;

    try {
      await client.query('TRUNCATE TABLE clientes_em_memoria;');

      const logEntriesResult = await client.query(
        'SELECT log_id, operacao, id_cliente, nome, saldo FROM log ORDER BY log_id ASC;'
      );
      
      const logs = logEntriesResult.rows;

      if (logs.length > 0) {
        logEntriesExist = true;
      } else {
        // Se não exite nenhum log na tabela de logs, não é necessário fazer nada, logo é um "sucesso".
        return true;
      }

      for (const entry of logs) {
        const { log_id, operacao, id_cliente, nome, saldo } = entry;
        try {
          if (String(operacao).toUpperCase() === 'INSERT') {
            await client.query(
              `INSERT INTO clientes_em_memoria (id, nome, saldo)
               VALUES ($1, $2, $3)
               ON CONFLICT (id) DO UPDATE SET
                 nome = EXCLUDED.nome,
                 saldo = EXCLUDED.saldo;`,
              [id_cliente, nome, saldo]
            );
          } else if (String(operacao).toUpperCase() === 'UPDATE') {
            const updateResult = await client.query(
              `UPDATE clientes_em_memoria
               SET nome = $1, saldo = $2
               WHERE id = $3;`,
              [nome, saldo, id_cliente]
            );
            if (updateResult.rowCount === 0) {
              // Se um UPDATE não afeta linhas, pode ser considerado uma falha lógica do REDO.
              operationsFailed++;
            }
          } else {
            operationsFailed++;
          }
        } catch (opError) {
          operationsFailed++;
        }
      }
      // Se nenhuma operação falhou, retornamos sucesso.
      return operationsFailed === 0;

    } catch (error) {
      return false;
    } finally {
      client.release();
    }
  }
}