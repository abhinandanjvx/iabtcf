import {Ping} from '../../model';

export type PingCallback = (pingReturn: Ping | null) => void;
