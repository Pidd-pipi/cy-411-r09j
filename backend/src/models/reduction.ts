import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user';

@Entity('reductions')
@Unique('uk_reduction_user_date_measure', ['userId', 'recordDate', 'measure'])
export class Reduction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: number;

  @Column({ length: 64 })
  measure!: string;

  @Column({ name: 'reduction_value', type: 'decimal', precision: 12, scale: 2 })
  reductionValue!: string;

  @Column({ length: 32 })
  unit!: string;

  @Column({ name: 'record_date', type: 'date' })
  recordDate!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note!: string | null;

  @ManyToOne(() => User, (user) => user.reductions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
