<script setup lang="ts">
import { ref } from 'vue'
import { Employee } from './models/employee'
import { use_database } from './stores/database_store'
import add_employee_component from './components/AddEmployeeComponent.vue'
import employee_component from './components/EmployeeComponent.vue'
import add_request_component from './components/AddRequestComponent.vue'
import request_component from './components/RequestComponent.vue'
import NotificationComponent from './components/NotificationComponent.vue'

const selected_employee = ref<Employee | undefined>(undefined)
const db = use_database()
</script>

<template>
    <header>
        <div class="navbar is-block has-background-light" role="navigation" aria-label="main navigation">
            <div class="navbar-brand">
                <div class="navbar-item">
                    <h1 class="has-text-weight-bold is-size-3">Testing</h1>
                </div>

                <div class="navbar-item ml-auto">
                    <p>Петя Иванов</p>
                </div>
            </div>
        </div>
    </header>

    <main class="section">
        <div class="container">
            <p class="title">Тестирование оборудования</p>

            <div class="columns">
                <div class="column is-5">
                    <div class="card">
                        <div class="card-header has-background-primary">
                            <div class="card-header-title">Рабочий</div>
                            <img
                                class="card-header-icon my-auto"
                                src="./assets/icons/icons8-worker-24.png"
                                alt="Mentor" />
                        </div>
                        <div class="card-content has-gap-y has-background-primary-light">
                            <add_employee_component />
                            <div v-for="employee_id in db.employees.value" :key="employee_id">
                                <employee_component
                                    :employee_id="employee_id"
                                    @selected="(m) => selected_employee = m"
                                    @deleted="db.remove_employee_by_id(employee_id)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="column" v-if="selected_employee !== undefined">
                    <div class="card">
                        <div class="card-header has-background-info">
                            <div class="card-header-title">Заявки рабочего: {{ selected_employee.fullname }}</div>
                            <img
                                class="card-header-icon my-auto"
                                src="./assets/icons/icons8-paper-24.png"
                                alt="team" />
                        </div>
                        <div class="card-content has-background-info-light has-gap-y">
                            <add_request_component :employee="selected_employee"
                                                   @saved="db.get_employee_by_id(selected_employee.id)
                                                                    .then(m => selected_employee = m)" />
                            <request_component :employee_id="selected_employee.id" :request_id="request.id"
                                               v-for="request in selected_employee.requests" :key="request.id"
                                               @saved="db.get_employee_by_id(selected_employee.id).then(e => selected_employee = e)"
                                               @deleted="db.get_employee_by_id(selected_employee.id).then(e => selected_employee = e)"
                                               @moved="db.reload_store().then(selected_employee = undefined)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <notification-component />
</template>

<style scoped>
.card-header-icon {
    cursor: initial;
}

.has-gap-y > * {
    margin-bottom: 1rem;
}

.has-gap-y > *:last-child {
    margin-bottom: 0;
}
</style>
