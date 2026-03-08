import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { User } from '../../user/entities/user.entity';

@Entity('affiliate_commissions')
export class AffiliateCommission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  affiliateId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: string;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ 
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status: 'pending' | 'paid' | 'canceled';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'affiliateId' })
  affiliate: User;
}
