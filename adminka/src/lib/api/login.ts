import type { AuthUser } from '@/lib/authApi';
import type { LoginCredentials, LoginExecutor, RegisterCredentials, RegisterExecutor } from '@/types/api/login';
import type { AuthTab } from '@/types/ui/login';

interface ExecuteAuthByTabParams {
    activeTab: AuthTab;
    loginExecutor: LoginExecutor;
    registerExecutor: RegisterExecutor;
    loginCredentials: LoginCredentials;
    registerCredentials: RegisterCredentials;
}

export const executeAuthByTab = async ({
    activeTab,
    loginExecutor,
    registerExecutor,
    loginCredentials,
    registerCredentials,
}: ExecuteAuthByTabParams): Promise<AuthUser> => {
    if (activeTab === 'login') {
        return loginExecutor(loginCredentials.email, loginCredentials.password);
    }

    return registerExecutor(registerCredentials);
};
