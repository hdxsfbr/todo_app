/**
 * Models
 */
var TodoItem = function(title, id) {
    this.title = title;
};

var TodoList = function() {
    this.todoItems = [];
    this.inProgressItems = [];
    this.completedItems = [];
};

TodoList.prototype.getTotalCount = function() {
    return  this.todoItems.length + this.inProgressItems.length + this.completedItems.length;
};

TodoList.prototype.getTodoCount = function() {
    return  this.todoItems.length;
};

TodoList.prototype.getInProgressCount = function() {
    return  this.inProgressItems.length;
};

TodoList.prototype.getCompletedCount = function() {
    return this.completedItems.length;
};

TodoList.prototype.addItem = function(todoItem) {
    this.todoItems.push(todoItem);
    $.event.trigger({type: "todo:itemAdded", item: todoItem});
};

TodoList.prototype.startItem = function(index) {
    this.inProgressItems.push(this.todoItems[index]);
    this.todoItems.splice(index,1);
    $.event.trigger({type: "todo:itemStarted"});
};

TodoList.prototype.completeItem = function(index) {
    this.completedItems.push(this.inProgressItems[index]);
    this.inProgressItems.splice(index,1);
    $.event.trigger({type: "todo:itemCompleted"});
};

/**
 * App
 */
var TodoApp = function(containerId) {
    this.list = new TodoList();
    this.containerId = containerId;
    this.render();
    this.hookEvents();
};

TodoApp.prototype.render = function() {
    $("#" + this.containerId ).html(_.template($("#todo-app-template").html(), {list: this.list}));
};

TodoApp.prototype.moveTodoItem = function(itemIndexOnSender, senderType, receiverType) {
    var senderId = senderType + "-container";
    var receiverId = receiverType + "-container";

    var $senderList = $("#" + senderId);
    var $receiverList = $("#" + receiverId);

    var self = this;

    if( senderType === "in-progress") {
        senderType = "inProgress"

    }
    if( receiverType === "in-progress") {
        receiverType = "inProgress"
    }

    receiverType +="Items";
    senderType +="Items";

    // TODO FIX
    this.list[receiverType] = [];
    this.list[senderType] = [];

    $senderList.find("li").each(function(index){
        self.list[senderType].push(new TodoItem($(this).text()));
    });

    $receiverList.find("li").each(function(index){
        self.list[receiverType].push(new TodoItem($(this).text()));
    });

    $.event.trigger({type: "todo:itemMoved", senderId: senderId, senderType:senderType, receiverId:receiverId, receiverType: receiverType});

};

TodoApp.prototype.hookSubmitEvent = function() {
    var self = this;
    $("#new-container").find("form").submit(function(e){
        var input = $("#new-todo-input");
        self.list.addItem(new TodoItem(input.val()));
        input.val("Enter Project Title...");
        e.preventDefault();
    });
};

TodoApp.prototype.hookDragDropEvents = function() {
    var self = this;

    function getTypeFromContainerId(senderId) {
        return  senderId.slice(0, senderId.lastIndexOf("-"));
    }

    function canDropTodoItem(senderType, receiverType) {
        return senderType === "in-progress" || //- Items in In Progress can be dragged into ToDo and Done.
            senderType === "completed" || //- Items in Done can be dragged into ToDo and In Progress.
            senderType === "todo" && receiverType === "in-progress"; //- Items in ToDo can be dragged into In Progress, but not into Done.
    }


    $( "#todo-container ul, #in-progress-container ul, #completed-container ul" ).sortable({
        connectWith: ".todo-list",
        receive: function(event, ui) {
            var itemIndexOnSender = $(ui.item).data("item_index");
            var senderType = getTypeFromContainerId($(ui.sender[0]).parent().attr("id"));
            var receiverType = getTypeFromContainerId($(ui.item).parent().parent().attr("id"));
            if (!canDropTodoItem(senderType, receiverType)) {
                $(ui.sender).sortable("cancel");
            } else {
                self.moveTodoItem(itemIndexOnSender, senderType, receiverType)
            }

        }
    }).disableSelection();
};

TodoApp.prototype.hookModelEvents = function() {
    var self = this;
    $(document).on("todo:itemAdded", function(e){
        var $todoContainer = $("#todo-container");
        $todoContainer.find("ul").append($("<li>" + e.item.title + "</li>"));
        $todoContainer.find(".counter").html(self.list.getTodoCount());
        $("#new-container").find(".counter").html(self.list.getTotalCount());
    });

    $(document).on("todo:itemMoved", function(e){
        $("#"+ e.receiverId).find(".counter").text(self.list[e.receiverType].length);
        $("#"+ e.senderId).find(".counter").text(self.list[e.senderType].length);
    });
};

TodoApp.prototype.hookEvents = function() {
    this.hookSubmitEvent();
    this.hookDragDropEvents();
    this.hookModelEvents();
};