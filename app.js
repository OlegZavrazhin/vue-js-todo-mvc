// Full spec-compliant TodoMVC with localStorage persistence
// and hash-based routing in ~120 effective lines of JavaScript.

var STORAGE_KEY = 'todos-vuejs-2.0'
var todoStorage = {
    fetch: function () {
        var todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        todos.forEach(function (todo, index) {
            todo.id = index
        })
        todoStorage.uid = todos.length
        return todos
    },
    save: function (todos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    }
}

var filters = {
    all: function (todos) {
        return todos
    },
    active: function (todos) {
        return todos.filter(function (todo) {
            return !todo.completed
        })
    },
    completed: function (todos) {
        return todos.filter(function (todo) {
            return todo.completed
        })
    }
}

var cases = {
    sortCase: function (arr, sortKey, reverse) {
        arr = convertArray(arr)
        if (!sortKey) {
            return arr
        }
        todo = (reverse && reverse < 0) ? -1 : 1
        return arr.slice().sort(function (a, b) {
            if (sortKey !== '$key') {
                if (isObject(a) && '$value' in a) a = a.$value
                if (isObject(b) && '$value' in b) b = b.$value
            }
            a = Vue.util.isObject(a) ? Vue.parsers.path.getPath(a, sortKey) : a
            b = Vue.util.isObject(b) ? Vue.parsers.path.getPath(b, sortKey) : b

            a = a.toLowerCase()
            b = b.toLowerCase()

            return a === b ? 0 : a > b ? todo : -todo
        })
    }
}

var app = new Vue({
    data: {
        todos: todoStorage.fetch(),
        newTodo: '',
        editedTodo: null,
        visibility: 'all',
        sortAsc: true
    },

    watch: {
        todos: {
            handler: function (todos) {
                todoStorage.save(todos)
            },
            deep: true
        }
    },

    computed: {
        filteredTodos: function () {
            var ascDesc = this.sortAsc ? 1 : -1;
            return filters[this.visibility](this.todos),
            this.todos.sort(function (a, b) {
                return ascDesc * a.title.localeCompare(b.title);
            });
        },
        remaining: function () {
            return filters.active(this.todos).length
        },
        allDone: {
            get: function () {
                return this.remaining === 0
            },
            set: function (value) {
                this.todos.forEach(function (todo) {
                    todo.completed = value
                })
            }
        },
        sortedData: function() {
        }
    },

    filters: {
        pluralize: function (n) {
            return n === 1 ? 'item' : 'items'
        }
    },

    methods: {
        addTodo: function () {
            var value = this.newTodo && this.newTodo.trim()
            if (!value) {
                return
            }
            this.todos.push({
                id: todoStorage.uid++,
                title: value,
                completed: false
            })
            this.newTodo = ''
        },

        removeTodo: function (todo) {
            this.todos.splice(this.todos.indexOf(todo), 1)
        },

        editTodo: function (todo) {
            this.beforeEditCache = todo.title
            this.editedTodo = todo
        },

        doneEdit: function (todo) {
            if (!this.editedTodo) {
                return
            }
            this.editedTodo = null
            todo.title = todo.title.trim()
            if (!todo.title) {
                this.removeTodo(todo)
            }
        },

        cancelEdit: function (todo) {
            this.editedTodo = null
            todo.title = this.beforeEditCache
        },

        removeCompleted: function () {
            this.todos = filters.active(this.todos)
        },

        invertSort: function(todo) {
            this.sortAsc = !this.sortAsc;
        }
    },

    directives: {
        'todo-focus': function (el, value) {
            if (value) {
                el.focus()
            }
        }
    }
})

function onHashChange () {
    var visibility = window.location.hash.replace(/#\/?/, '')
    if (filters[visibility]) {
        app.visibility = visibility
    } else {
        window.location.hash = ''
        app.visibility = 'all'
    }
}

window.addEventListener('hashchange', onHashChange)
onHashChange()

app.$mount('.todoapp')
