import pool from '../config/database.js';

export class SqlService {
  
  async executeCommands(sqlString) {
    const client = await pool.connect();
    
    try {
      // Remove comentários e quebras de linha desnecessárias
      const cleanedSql = this.cleanSqlString(sqlString);
      
      // Verifica se contém comandos de transação
      const hasTransaction = this.hasTransactionCommands(cleanedSql);
      
      if (hasTransaction) {
        return await this.executeWithTransaction(client, cleanedSql);
      } else {
        return await this.executeIndividualCommands(client, cleanedSql);
      }
      
    } catch (error) {
      console.error('Erro ao executar comandos SQL:', error);
      throw new Error(`Erro na execução SQL: ${error.message}`);
    } finally {
      client.release();
    }
  }
  
  cleanSqlString(sqlString) {
    return sqlString
      .replace(/--.*$/gm, '') // Remove comentários de linha
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários de bloco
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }
  
  hasTransactionCommands(sql) {
    const transactionKeywords = /\b(BEGIN|START\s+TRANSACTION|COMMIT|END|ROLLBACK)\b/i;
    return transactionKeywords.test(sql);
  }
  
  async executeWithTransaction(client, sqlString) {
    const results = [];
    
    // Divide os comandos por ponto e vírgula, mas preserva a estrutura da transação
    const commands = this.splitSqlCommands(sqlString);
    
    let inTransaction = false;
    let hasExplicitCommit = false;
    
    for (const command of commands) {
      if (!command.trim()) continue;
      
      const upperCommand = command.trim().toUpperCase();
      
      try {
        if (upperCommand.startsWith('BEGIN') || upperCommand.startsWith('START TRANSACTION')) {
          await client.query('BEGIN');
          inTransaction = true;
          results.push({
            command: command.trim(),
            status: 'success',
            message: 'Transação iniciada'
          });
        } else if (upperCommand.startsWith('COMMIT') || upperCommand.startsWith('END')) {
          if (inTransaction) {
            await client.query('COMMIT');
            hasExplicitCommit = true;
            inTransaction = false;
            results.push({
              command: command.trim(),
              status: 'success',
              message: 'Transação confirmada'
            });
          } else {
            results.push({
              command: command.trim(),
              status: 'warning',
              message: `${upperCommand.startsWith('COMMIT') ? 'COMMIT' : 'END'} executado fora de transação`
            });
          }
        } else if (upperCommand.startsWith('ROLLBACK')) {
          if (inTransaction) {
            await client.query('ROLLBACK');
            inTransaction = false;
            results.push({
              command: command.trim(),
              status: 'success',
              message: 'Transação cancelada'
            });
          } else {
            results.push({
              command: command.trim(),
              status: 'warning',
              message: 'ROLLBACK executado fora de transação'
            });
          }
        } else {
          // Comando SQL normal
          const result = await client.query(command.trim());
          results.push({
            command: command.trim(),
            status: 'success',
            rowCount: result.rowCount,
            rows: result.rows || [],
            message: `Comando executado com sucesso`
          });
        }
      } catch (error) {
        if (inTransaction) {
          await client.query('ROLLBACK');
          inTransaction = false;
        }
        
        results.push({
          command: command.trim(),
          status: 'error',
          error: error.message
        });
        
        throw new Error(`Erro no comando: ${command.trim()}\nDetalhes: ${error.message}`);
      }
    }
    
    // Se ainda estiver em transação e não houve COMMIT explícito, faz rollback
    if (inTransaction && !hasExplicitCommit) {
      await client.query('ROLLBACK');
      results.push({
        command: 'AUTO ROLLBACK',
        status: 'warning',
        message: 'Transação cancelada automaticamente (sem COMMIT explícito)'
      });
    }
    
    return {
      success: true,
      transactionMode: true,
      results: results,
      summary: {
        totalCommands: results.length,
        successful: results.filter(r => r.status === 'success').length,
        warnings: results.filter(r => r.status === 'warning').length,
        errors: results.filter(r => r.status === 'error').length
      }
    };
  }
  
  async executeIndividualCommands(client, sqlString) {
    const results = [];
    const commands = this.splitSqlCommands(sqlString);
    
    for (const command of commands) {
      if (!command.trim()) continue;
      
      try {
        const result = await client.query(command.trim());
        results.push({
          command: command.trim(),
          status: 'success',
          rowCount: result.rowCount,
          rows: result.rows || [],
          message: 'Comando executado com sucesso'
        });
      } catch (error) {
        results.push({
          command: command.trim(),
          status: 'error',
          error: error.message
        });
        
        throw new Error(`Erro no comando: ${command.trim()}\nDetalhes: ${error.message}`);
      }
    }
    
    return {
      success: true,
      transactionMode: false,
      results: results,
      summary: {
        totalCommands: results.length,
        successful: results.filter(r => r.status === 'success').length,
        warnings: 0,
        errors: results.filter(r => r.status === 'error').length
      }
    };
  }
  
  splitSqlCommands(sqlString) {
    // Divide por ponto e vírgula, mas preserva strings e comandos complexos
    const commands = [];
    let currentCommand = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < sqlString.length; i++) {
      const char = sqlString[i];
      const prevChar = i > 0 ? sqlString[i - 1] : '';
      
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
      
      if (char === ';' && !inString) {
        if (currentCommand.trim()) {
          commands.push(currentCommand.trim());
        }
        currentCommand = '';
      } else {
        currentCommand += char;
      }
    }
    
    // Adiciona o último comando se não terminou com ponto e vírgula
    if (currentCommand.trim()) {
      commands.push(currentCommand.trim());
    }
    
    return commands;
  }
  

  validateSqlSafety(sqlString) {
    // Lista de comandos potencialmente perigosos
    const dangerousCommands = [
      'DROP DATABASE',
      'DROP SCHEMA',
      'TRUNCATE',
      'ALTER SYSTEM',
      'CREATE USER',
      'DROP USER',
      'GRANT',
      'REVOKE'
    ];
    
    const upperSql = sqlString.toUpperCase();
    const foundDangerous = dangerousCommands.filter(cmd => upperSql.includes(cmd));
    
    return {
      isSafe: foundDangerous.length === 0,
      dangerousCommands: foundDangerous
    };
  }
}