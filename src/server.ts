import e from "express"
import * as path from "path"
import * as todo from "./todo"
import bodyParser from "body-parser"
import { config } from "./config"
import remove from 'lodash.remove'

const STATIC_DIR = path.join(__dirname, '..', 'static')
const DIST_DIR = path.join(__dirname, '..', 'dist')
const TOAST_DIR = path.join(__dirname, '..', 'node_modules',
    'jquery-toast-plugin', 'dist')

const app = e()

app.use('/', e.static(STATIC_DIR))
app.use('/dist', e.static(DIST_DIR))
app.use('/toast', e.static(TOAST_DIR))

app.use(bodyParser.urlencoded({ extended: true }))

/**
 * Dynamic routes
 */
app.get("/list", (req, res) => {
    res.json(todo.model)
})

app.post("/add", (req, res) => {
    const hasDescription = "description" in req.body
    const hasTags = "tags" in req.body
    const pushItem = req.body
    let lastId = todo.model.slice(-1).pop()?.id
    lastId = lastId ? lastId + 1 : 1
    pushItem.id = lastId


    if (hasDescription && hasTags) {
        todo.model.push(pushItem)
        res.json({ status: "ok" })
    } else {
        res.json({ status: "failed" })
    }
})

app.delete("/delete", (req, res) => {
    console.log(req.body)
    try {
        let id: number = req.body.id
        const element = remove(todo.model, function (element: todo.ToDo) {

            if (element.id == id)
                return element;
        })
        if (element[0])
            res.json({status: "204"})
        else
            res.json({status: "404"});
    } catch (err) {
        console.log('Error on element delete:', err)
        res.send({status: "500"});
    }

})



/**
 * OS signal handling
 * Automatic saving of the data model to disk
 * when the server shuts down
 */
process.once('exit', (code) => {
    console.log(`Server exiting with code ${code}...`)
    todo.saveFile()
    console.log(`Server exited`)
})

function exitHandler() {
    process.exit()
}

process.once("SIGINT", exitHandler)
process.once("SIGUSR2", exitHandler)


app.listen(config["server-port"], () => {
    todo.loadFile()
    console.log("ToDo! server Listening on port " + config["server-port"])
})