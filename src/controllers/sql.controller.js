import { SqlService } from '../services/sql.service.js';

const sqlService = new SqlService();

export class SqlController {
  
  async executeCommands(req, res) {
    try {
      const { sqlCommands } = req.body;
      
      if (!sqlCommands || typeof sqlCommands !== 'string') {
        return res.status(400).json({ 
          error: 'sqlCommands é obrigatório e deve ser uma string' 
        });
      }
      
      if (sqlCommands.trim().length === 0) {
        return res.status(400).json({ 
          error: 'sqlCommands não pode estar vazio' 
        });
      }
      
      const safetyCheck = sqlService.validateSqlSafety(sqlCommands);
      if (!safetyCheck.isSafe) {
        return res.status(403).json({
          error: 'Comandos SQL potencialmente perigosos detectados',
          dangerousCommands: safetyCheck.dangerousCommands,
          warning: 'Se necessário, remova a validação de segurança no service'
        });
      }
      
      const result = await sqlService.executeCommands(sqlCommands);
      
      res.json({
        success: true,
        message: 'Comandos SQL executados com sucesso',
        data: result
      });
      
    } catch (error) {
      console.error('Erro no controller SQL:', error);
      res.status(500).json({ 
        error: error.message,
        success: false
      });
    }
  }
  
  // SEM MODO DE SEGURANÇA
  async executeCommandsUnsafe(req, res) {
    try {
      const { sqlCommands } = req.body;
      
      if (!sqlCommands || typeof sqlCommands !== 'string') {
        return res.status(400).json({ 
          error: 'sqlCommands é obrigatório e deve ser uma string' 
        });
      }
      
      if (sqlCommands.trim().length === 0) {
        return res.status(400).json({ 
          error: 'sqlCommands não pode estar vazio' 
        });
      }
      
      const result = await sqlService.executeCommands(sqlCommands);
      
      res.json({
        success: true,
        message: 'Comandos SQL executados com sucesso (modo unsafe)',
        data: result
      });
      
    } catch (error) {
      console.error('Erro no controller SQL:', error);
      res.status(500).json({ 
        error: error.message,
        success: false
      });
    }
  }
}