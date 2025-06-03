import pool from '../config/database.js';

export class RedoService {
  async executeRedo() {
    const client = await pool.connect();
    let operationsFailed = 0;
    const redoTransactionsList = []; //Imprimir quais transações devem realizar o REDO
    const appliedData = [];        // Reportar quais dados foram atualizados
    let overallSuccess = true;
    try {
      await client.query('TRUNCATE TABLE clientes_em_memoria;');
      const logEntriesResult = await client.query(
        'SELECT log_id, operacao, id_cliente, nome, saldo FROM log ORDER BY log_id ASC;'
      );
      
      const logs = logEntriesResult.rows;

      if (logs.length === 0) {
        return {
          success: true,
          redoTransactionsList: [],
          appliedData: [],
        };
      }

      for (const entry of logs) {
        const { log_id, operacao, id_cliente, nome, saldo } = entry;
        redoTransactionsList.push({ log_id: log_id, operation_type: operacao, client_id: id_cliente });
        await client.query('BEGIN');
        let operation = false;

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
            operation = true;
          } else if (String(operacao).toUpperCase() === 'UPDATE') {
            const updateResult = await client.query(
              `UPDATE clientes_em_memoria
               SET nome = $1, saldo = $2
               WHERE id = $3;`,
              [nome, saldo, id_cliente]
            );
            if (updateResult.rowCount > 0) {
              operation = true;
            } else {
              operationsFailed++;
            }
          } else if(String(operacao).toUpperCase() === 'DELETE') {
            const deleteResult = await client.query(
              `DELETE FROM clientes_em_memoria
               WHERE id = $1;`,
              [id_cliente]
            );
            if (deleteResult.rowCount > 0) {
              operation = true;
            } else {
              operationsFailed++;
            }
          }else
          {
            operationsFailed++;
          }

          if (operation) {//tirar da tabela de log para não ficar duplicado após "reinserir" na tabela de clientes_em_memoria por causa do trigger e salvando logs aplicados
            await client.query('DELETE FROM log WHERE log_id = $1;', [log_id]);
            appliedData.push({ 
              log_id: log_id, 
              operation: operacao, 
              client_id: id_cliente, 
              data: { 
                nome: nome,
                saldo: saldo
              }
            });
          }
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          operationsFailed++;
        }
      }
      
      overallSuccess = operationsFailed === 0;

      return {
        success: overallSuccess,
        redoTransactionsList: redoTransactionsList,
        appliedData: appliedData,
      };

    } catch (error) {
      return {
        success: false,
        redoTransactionsList: [], 
        appliedData: [],
      };
    } finally {
      client.release();
    }
  }
}