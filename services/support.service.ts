import api from './api';

export interface SupportMessage {
    id: string;
    text: string;
    isFromSupport: boolean;
    type?: string;
    mediaUrl?: string;
    createdAt: string;
}

export interface SupportTicket {
    id: string;
    userId: string;
    subject: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    evidence?: string[];
    messages?: SupportMessage[];
    createdAt: string;
    updatedAt: string;
}

export const supportService = {
    async createTicket(subject: string, description: string, evidence?: string[]): Promise<SupportTicket> {
        const response = await api.post('/support/tickets', { subject, description, evidence });
        return response.data;
    },

    async getUserTickets(): Promise<SupportTicket[]> {
        const response = await api.get('/support/tickets');
        return response.data?.items || [];
    },

    async getTicketDetails(id: string): Promise<SupportTicket> {
        const response = await api.get(`/support/tickets/${id}`);
        return response.data;
    },

    async sendMessage(ticketId: string, text: string, type: string = 'text', mediaUrl?: string): Promise<SupportMessage> {
        const response = await api.post(`/support/tickets/${ticketId}/messages`, { text, type, mediaUrl });
        return response.data;
    }
};
