import $ from "jquery"
import { NewItem, ToDo } from "./todo"
import "jquery-toast-plugin"
import { response } from "express"
import { isConstructorDeclaration } from "typescript"
const STORAGE_KEY = "toDoObjects"

// const svgfile = require("./recicle.svg") as string;

async function populateNewest() {
    console.log('to no populate')
    const $content = $("<ul>")
    const titles = await load()

    for (let i = titles.length - 1; i >= 0; i--) {
        $content.append($("<li>").text(titles[i].description).append($("<img>").attr({
            'data-id': `${titles[i].id}`,
            'src': 'recicle.svg',
            'class': 'close-butn'
        })))
    }



    return $content
}

async function populateOldest() {
    const $content = $("<ul>")
    const titles = await load()

    for (let i = 0; i < titles.length; i++) {
        $content.append($("<li>").text(titles[i].description).append($("<img>").attr({
            'data-id': `${titles[i].id}`,
            'src': 'recicle.svg',
            'class': 'close-butn'
        })))
    }

    return $content
}

async function populateGroupedByTags() {
    const $content = $('<dl>')
    const titles = await load()

    const tags = [
        'shopping',
        'chores',
        'writing',
        'work',
        'teaching',
        'pets'
    ]

    tags.map(tags => {
        $content.append($("<dt>").text(tags))
        for (let i = 0; i < titles.length; i++) {

            if (titles[i].tags.includes(tags)) {
                $content.append($("<dd>").text(titles[i].description).append($("<img>").attr({
                    'data-id': `${titles[i].id}`,
                    'src': 'recicle.svg',
                    'class': 'close-butn'
                })))
            }
        }
    })


    return $content;
    // TODO: implement as a exercise
}

function populateAdd() {
    const $descLabel = $('<label for="description">').text("Description: ")
    const $descInput = $('<input name="description" required>').addClass("description")
    const $tagLabel = $('<label for="tags">').text("Tags: ")
    const $tagInput = $('<input name="tags" required>').addClass("tags")
    const $button = $('<button type="submit">').text("+")
    const $form = $('<form action="/add" method="post">')

    $form.on("submit", function (ev) {
        const description = $descInput.val()?.toString().trim() || ""
        const tags = $tagInput.val()?.toString().split(",")
            .map(s => s.trim()) || []

        if (description.length > 0 && tags.length > 0) {
            try {
                saveOne({
                    "description": description,
                    "tags": tags
                }).then(() => {
                    $.toast({ text: "Todo item added successfully" })
                    $("#newest").trigger("click")
                })
                    .catch((err) => {
                        $.toast({ text: "Failed to save todo item remotely" })
                        console.log((err as Error).stack)
                    })

            } catch (err) {
                $.toast({ text: "Failed to save todo item remotely" })
                console.log((err as Error).stack)
            }
        } else {
            $.toast({ text: "Failed to add a new todo item" })
        }

        $tagInput.val("")
        $descInput.val("")

        ev.preventDefault();
    });

    return $("<div>").append($form.append($descLabel).append($descInput)
        .append($tagLabel).append($tagInput).append($button))

}



async function saveOne(todo: NewItem) {
    let response: any

    try {
        response = await $.post($("form").attr("action") || "", todo)
    } catch (err) {
        throw err
    }

    if ("status" in response && response.status != "ok") {
        throw "Failed to save todo item remotely"
    }
}


async function deleteUser(id: number): Promise<string> {
    let response: any

    try {
        response = await $.ajax({
            type: "DELETE",
            url: "/delete",
            data: { "id": id },
        });
        // res = await fetch('/list/delete', {
        //     method: 'DELETE',
        //     body: JSON.stringify({ id: id })
        // }).then(response => {
        //     console.log(response.body)
        //     return response.json()
        // })


        if ("status" in response && response.status != "204") {
            throw "Failed delete item remotely"
        }
    } catch (error) {
        console.log((error as Error).stack)
        $.toast({ text: "Failed to delete item from the server" })
    }

    $.toast({ text: "Item successfully deleted from the server" })

    return response;

}


async function load(): Promise<ToDo[]> {
    let model: ToDo[] = []

    try {
        model = await $.getJSON("/list")
    } catch (error) {
        console.log((error as Error).stack)
        $.toast({ text: "Failed to load items from the server" })
    }
    return model
}



function imageBtn() {
    $('.close-butn').on('click', function () {
        const id = $(this).attr('data-id');
        if (id) {
            var y: number = +id;
            console.log('clickou em ', (typeof id))
            deleteUser(y)
        }

        $('.active').click()

    })

}


function main() {
    $(".tabs a span").on("click", function () {

        $(".tabs a span").removeClass("active")
        $(this).addClass("active")
        $("main .content").empty()

        const addContent = function (result: JQuery<HTMLElement>) {
            $("main .content").append(result)
        }

        if ($(this).is("#newest")) {
            populateNewest().then(addContent).then(imageBtn)
        }
        else if ($(this).is("#oldest")) {
            populateOldest().then(addContent).then(imageBtn)
        }
        else if ($(this).is("#tags")) {
            populateGroupedByTags().then(addContent).then(imageBtn)
        }
        else if ($(this).is("#add")) {
            addContent(populateAdd())
        }
        else {
            addContent($("<p>").append("Failed to load data"))
        }

        return false
    })


    $("#newest").trigger("click")
}

$(main)