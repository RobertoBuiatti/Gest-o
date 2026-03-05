export interface IUserRepository {
	findByEmail(email: string): Promise<any>;
	findById(id: string): Promise<any>;
	create(data: any): Promise<any>;
}
