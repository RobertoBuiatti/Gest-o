import { Order, OrderItem, Product, User, Transaction } from "@prisma/client";

export interface IOrderWithDetails extends Order {
	items: (OrderItem & { product: Product })[];
	user: { id: string; name: string };
	transactions?: Transaction[];
}

export interface IOrderRepository {
	findAll(filters: any): Promise<any>;
	findById(id: string): Promise<IOrderWithDetails | null>;
	findLastOrderNumber(): Promise<number>;
	create(data: any): Promise<IOrderWithDetails>;
	update(id: string, data: any): Promise<IOrderWithDetails>;
	updateStatus(id: string, status: string): Promise<Order>;
	deleteMany(): Promise<void>;

	// Métricas
	getMetrics(startDate: Date, endDate: Date, context: string): Promise<any>;
}
