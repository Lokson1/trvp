<script lang="ts">
import { defineComponent } from 'vue'
import { use_database } from '../stores/database_store'
import { use_notification } from '../stores/notification_store'
import { Request } from '../models/request'
import * as bulmaCalendar from 'bulma-calendar'
import { overlaps } from '../utils'

type State = 'loading' | 'viewing' | 'editing'
type Event = 'edit' | 'save' | 'cancel' | 'load' | 'remove'

const db = use_database()
const { show } = use_notification()

export default defineComponent({
    props: {
        employee_id: { type: Number, required: true },
        request_id: { type: Number, required: true }
    },
    emits: ['saved', 'invalid', 'deleted', 'moved'],
    async mounted() {
        this.request = await db.get_request_by_id(this.employee_id, this.request_id)
        for (const id of db.employees.value) {
            this.names.push([id, (await db.get_employee_by_id(id)).fullname])
        }
        const calendar = bulmaCalendar.attach('input[type = date]', {
            startDate: this.request.start_booking,
            endDate: this.request.end_booking,
            isRange: true
        })[0]
        calendar.on('select', args => {
            this.request.start_booking = args.data.startDate
            this.request.end_booking = args.data.endDate
        })

        this.send('load')
    },
    data() {
        return {
            state: 'viewing' as State,
            request: undefined as Request | undefined,
            target_employee_id: this.employee_id,
            names: [] as [number, string][]
        }
    },
    methods: {
        send(event: Event) {
            switch (event) {
                case 'edit':
                    this.state = 'editing'
                    break
                case 'save':
                    (async () => {
                        const validation = await this.validate()
                        if (validation === true) {
                            if (this.target_employee_id !== this.employee_id) {
                                await db.remove_request_by_id(this.employee_id, this.request_id)
                                await db.add_request(this.target_employee_id, this.request.facility, this.request.start_booking, this.request.end_booking)
                                this.$emit('moved')
                            } else {
                                console.log(this.request)
                                await db.update_request(this.employee_id, this.request)
                                this.$emit('saved')
                            }
                            this.state = 'viewing'
                        } else {
                            show(validation[1], true)
                            this.$emit('invalid')
                        }
                    })()
                    break
                case 'cancel':
                    db.get_request_by_id(this.employee_id, this.request_id)
                        .then(t => this.team = t)
                        .then(_ => this.state = 'viewing')
                    break
                case 'load':
                    this.state = 'viewing'
                    break
                case 'remove':
                    db.remove_request_by_id(this.employee_id, this.request_id)
                        .then(_ => this.$emit('deleted'))
                    break
            }
        },
        async validate(): Promise<[false, string] | true> {
            if (this.request.end_booking === undefined || this.request.start_booking === undefined)
                return [false, 'Не выбран промежуток времени для бронирования']
            if (this.request.end_booking <= this.request.start_booking)
                return [false, 'Конец бронирования оборудования не должен быть раньше начала']
            if (this.request.facility.id === undefined)
                return [false, 'Выберите оборудование']
            if (this.request.facility.amount === 0)
                return [false, 'Оборудования не осталось']
            const requests = await db.get_all_requests()
            for (let request of requests) {
                if (request.id !== this.request_id && overlaps(
                    { from: request.start_booking, to: request.end_booking },
                    { from: this.request.start_booking, to: this.request.end_booking }))
                    return [false, 'Бронирования пересекаются']
            }
            return true
        }
    }
})
</script>

<template>
    <div class="card" draggable="true" v-if="request !== undefined">
        <div class="card-header has-background-dark">
            <div class="card-header-title has-text-light">
                Оборудование: «{{ request.facility.name }}»
            </div>
        </div>
        <div class="card-content">
            <div>
                <div class="columns is-mobile">
                    <div class="column">
                        <p>Бронирование:</p>
                    </div>
                    <div class="column" v-if="state === 'viewing'">
                        C <strong>{{ request.start_booking.toDateString() }}</strong> по
                        <strong>{{ request.end_booking.toDateString() }}</strong>
                    </div>
                    <div v-show="state === 'editing'" class="column">
                        <input type="date">
                    </div>
                </div>
            </div>
            <div>
                <div class="columns is-mobile is-align-items-center" v-if="state === 'editing'">
                    <div class="column">Переместить к:</div>
                    <div class="column">
                        <div class="select">
                            <select v-model="target_employee_id">
                                <option selected disabled>Выбрать</option>
                                <option v-for="name in names" :key="name[0]" :value="name[0]">{{ name[1] }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card-footer" v-if="state === 'viewing'">
            <a @click="send('edit')" class="card-footer-item">Изменить</a>
            <a @click="send('remove')" class="card-footer-item">Удалить</a>
        </div>
        <div class="card-footer" v-else>
            <a @click="send('save')" class="card-footer-item">Сохранить</a>
            <a @click="send('cancel')" class="card-footer-item">Отменить</a>
        </div>
    </div>
</template>

<style scoped>
.w-100 {
    max-width: 100%;
    min-width: 100%;
    width: 100%;
    resize: vertical;
    height: auto;
}
</style>