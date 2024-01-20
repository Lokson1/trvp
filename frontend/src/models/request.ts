import { Facility } from './facility'

export class Request {
    public start_booking: Date
    public end_booking: Date

    constructor(
        public readonly id: number,
        public facility: Facility,
        start_booking: Date | string,
        end_booking: Date | string
    ) {
        if (typeof start_booking === 'string')
            this.start_booking = new Date(start_booking)
        if (typeof end_booking === 'string')
            this.end_booking = new Date(end_booking)
    }
}
