import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class StopService {
  
  async stopPostgreSQL(username, password) {
    try {
      if (!username || !password) {
        throw new Error('Username e password são obrigatórios');
      }

      // Executa comando com sudo usando echo para passar a senha
      const command = `echo '${password}' | sudo -S systemctl stop postgresql`;
      await execAsync(command);
      
      return {
        success: true,
        message: 'PostgreSQL parado com sucesso',
        platform: 'Ubuntu'
      };
    } catch (error) {
      // Se systemctl falhar, tenta service
      try {
        const command = `echo '${password}' | sudo -S service postgresql stop`;
        await execAsync(command);
        
        return {
          success: true,
          message: 'PostgreSQL parado com sucesso (service)',
          platform: 'Ubuntu'
        };
      } catch (serviceError) {
        return {
          success: false,
          message: `Erro ao parar PostgreSQL: ${error.message}`,
          platform: 'Ubuntu'
        };
      }
    }
  }

  async startPostgreSQL(username, password) {
    try {
      if (!username || !password) {
        throw new Error('Username e password são obrigatórios');
      }

      // Executa comando com sudo usando echo para passar a senha
      const command = `echo '${password}' | sudo -S systemctl start postgresql`;
      await execAsync(command);
      
      return {
        success: true,
        message: 'PostgreSQL iniciado com sucesso',
        platform: 'Ubuntu'
      };
    } catch (error) {
      // Se systemctl falhar, tenta service
      try {
        const command = `echo '${password}' | sudo -S service postgresql start`;
        await execAsync(command);
        
        return {
          success: true,
          message: 'PostgreSQL iniciado com sucesso (service)',
          platform: 'Ubuntu'
        };
      } catch (serviceError) {
        return {
          success: false,
          message: `Erro ao iniciar PostgreSQL: ${error.message}`,
          platform: 'Ubuntu'
        };
      }
    }
  }

  async checkStatus() {
    try {
      // Verifica status sem precisar de sudo
      const { stdout } = await execAsync('systemctl is-active postgresql');
      const isActive = stdout.trim() === 'active';
      
      return {
        success: true,
        isRunning: isActive,
        status: isActive ? 'ativo' : 'parado',
        platform: 'Ubuntu'
      };
    } catch (error) {
      // Se systemctl falhar, verifica processos
      try {
        const { stdout } = await execAsync('pgrep -f postgres');
        const hasProcesses = stdout.trim().length > 0;
        
        return {
          success: true,
          isRunning: hasProcesses,
          status: hasProcesses ? 'rodando (detectado via pgrep)' : 'parado',
          platform: 'Ubuntu'
        };
      } catch (pgrepError) {
        return {
          success: true,
          isRunning: false,
          status: 'parado',
          platform: 'Ubuntu'
        };
      }
    }
  }
}