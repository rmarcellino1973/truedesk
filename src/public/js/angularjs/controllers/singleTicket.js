/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

define(['angular', 'underscore', 'jquery', 'modules/socket', 'modules/navigation', 'tomarkdown', 'modules/helpers', 'history'], function(angular, _, $, socket, nav, md, helpers) {
    return angular.module('trudesk.controllers.singleTicket', [])
        .controller('singleTicket', function($scope, $http, $q) {

            //Setup Assignee Drop based on Status
            var ticketStatus = $('#__ticketStatus').html();
            var assigneeListBtn = $('.ticket-assignee > a');
            if (assigneeListBtn.length > 0 && ticketStatus.length > 0) {
                if (ticketStatus == '3') {
                    assigneeListBtn.removeAttr('data-notifications');
                    assigneeListBtn.removeAttr('data-updateUi');
                    nav.notifications();
                }
            }

            $scope.showStatusSelect = function() {
                var statusSelect = $('#statusSelect');
                if (statusSelect.length > 0) {
                    if (statusSelect.hasClass('hide')) {
                        statusSelect.removeClass('hide');
                    } else {
                        statusSelect.addClass('hide');
                    }
                }
            };

            $scope.changeStatus = function(status) {
                var id = $('#__ticketId').html();
                var statusSelectBox = $('#statusSelect');
                if (statusSelectBox.length > 0) statusSelectBox.addClass('hide');

                socket.ui.sendUpdateTicketStatus(id, status);
            };

            $scope.clearAssignee = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.clearAssignee(id);
                }
            };

            $scope.types = [];
            $scope.priorities = [
                {name: 'Normal', value: 1},
                {name: 'Urgent', value: 2},
                {name: 'Critical', value: 3}
            ];
            $scope.groups = [];

            $scope.selected_priority = _.findWhere($scope.priorities, {value: $scope.ticketPriority});
            var ticketTypes = $http.get('/api/v1/tickets/types').
                                success(function(data) {
                                    _.each(data, function(item) {
                                        $scope.types.push(item);
                                    });
                                }).
                                error(function(e) {
                                    console.log('[trudesk:singleTicket:ticketTypes] - ' + e);
                                });

            $q.all([ticketTypes]).then(function(ret) {
                $scope.selected_type = _.findWhere($scope.types, {_id: $scope.ticketType});
            });

            var groupHttpGet = $http.get('/api/v1/groups').
                                success(function(data) {
                                    _.each(data.groups, function(item) {
                                        $scope.groups.push(item);
                                    });
                                }).
                                error(function(e) {
                                    console.log('[trudesk:singleTicket:groupHttpGet] - ' + e);
                                });

            $q.all([groupHttpGet]).then(function(ret) {
                $scope.selected_group = _.findWhere($scope.groups, {_id: $scope.ticketGroup});
            });

            $scope.updateTicketType = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.setTicketType(id, $scope.selected_type);
                }
            };

            $scope.updateTicketPriority = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.setTicketPriority(id, $scope.selected_priority);
                }
            };

            $scope.updateTicketGroup = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    socket.ui.setTicketGroup(id, $scope.selected_group);
                }
            };

            $scope.updateTicketIssue = function() {
                var id = $('#__ticketId').html();
                if (id.length > 0) {
                    var issue = $('form#edit-issue-form').find('textarea#issueText').val();
                    issue = '<p>' + issue + '</p>';
                    socket.ui.setTicketIssue(id, issue);
                }
            };

            $scope.editIssueCancelClicked = function($event) {
                $event.preventDefault();
                var issueForm = $('.edit-issue-form');
                var issueText = $('.initial-issue').find('.issue-text').find('.issue-body');

                if (issueForm.length > 0 && issueText.length > 0) {
                    issueText.removeClass('hide');
                    issueForm.addClass('hide');

                    //Setup Text
                    var iText = $('.issue-text').find('div.issue-body').html();
                    //iText = iText.replace(/(<br>)|(<br \/>)|(<p>)|(<\/p>)/g, "\r\n");
                    //iText = iText.replace(/(<([^>]+)>)/ig,"");
                    iText = md(iText);
                    iText = iText.trim();
                    $('#issueText').val(iText);
                }
            };

            $scope.showUploadAttachment = function($event) {
                $event.preventDefault();
                var self = $($event.currentTarget);
                var inputField = self.parents('form').find('input.attachmentInput');
                if (inputField.length > 0) {
                    $(inputField).trigger('click');
                }
            };

            $scope.SubscriberChange = function() {
                var id = $('#__ticketId').html();
                $http.put(
                    '/api/v1/tickets/' + id + '/subscribe',
                    {
                        "user" : $scope.user,
                        "subscribe": $scope.subscribed
                    }
                ).success(function() {

                    }).error(function(e) {
                        console.log('[trudesk:singleTicket:SubscriberChange] - ' + e);
                        helpers.showFlash('Error: ' + e.message, true);
                    });
            };

            $scope.showAddTags = function(event) {
                event.preventDefault();
                var tagModal = $('#addTagModal');
                if (tagModal.length > 0) {
                    tagModal.find('#tags').trigger('chosen:updated');
                    tagModal.foundation('reveal', 'open');
                }
            };

            $scope.showTags = function(event) {
                event.preventDefault();
                var tagModal = $('#addTagModal');
                if (tagModal.length > 0) {
                    tagModal.find('option').prop('selected', false);
                    //tagModal.find('select').trigger('chosen:updated');
                    var selectedItems = [];
                    $('.__TAG_SELECTED').each(function() {
                        var i = $(this).text();
                        if (i.length > 0) {
                            selectedItems.push(i);
                        }
                    });
                    _.each(selectedItems, function(item) {
                        var option = tagModal.find('#tags').find('option[value="' + item + '"]');
                        option.prop('selected', 'selected');
                    });

                    tagModal.find('select').trigger('chosen:updated');

                    tagModal.foundation('reveal', 'open');
                }
            };

            $scope.submitAddNewTag = function(event) {
                event.preventDefault();
                var form = $('form#addTagForm');
                if (form.length > 0) {
                    var tag = form.find('#tag').val();
                    var data = {
                        tag: tag
                    };

                    $http({
                        method: "POST",
                        url: '/api/v1/tickets/addtag',
                        data: data,
                        headers: { 'Content-Type': 'application/json'}
                    })
                        .success(function(data) {
                            var tagModal = $('#addTagModal');
                            var tagFormField = $('#tags');
                            tagFormField.append('<option id="TAG__"' + data.tag._id + '" value="' + data.tag._id + '" selected>' + data.tag.name + '</option>');
                            tagFormField.find('option#TAG__' + data.tag._id).prop('selected', true);
                            tagFormField.trigger('chosen:updated');
                            tagFormField.find('#tag').val('');
                            if (tagModal.length > 0) tagModal.foundation('reveal', 'close');
                            setTimeout(function() {
                                $scope.showAddTags(event);
                            }, 250);
                        })
                        .error(function(err) {
                            console.log('[trudesk:tickets:addTag} - Error: ' + err.error);
                            helpers.showFlash('Error: ' + err.error, true);
                        });
                }
            };

            $scope.submitAddTags = function(event) {
                event.preventDefault();
                var id = $('#__ticketId').text();
                var form = $(event.target);
                if (form.length < 1) return;
                var tagField = form.find('#tags');
                if (tagField.length < 1) return;
                //var user = form.find('input[name="from"]').val();
                $http.put('/api/v1/tickets/' + id,
                    {
                        "tags": tagField.val()

                    }).success(function(data) {
                        helpers.showFlash('Tags have been added.');
                        socket.ui.refreshTicketTags(id);

                        $('#addTagModal').foundation('reveal', 'close');
                }).error(function(e) {
                    console.log('[trudesk:singleTicket:submitAddTags] - ' + e);
                    helpers.showFlash('Error: ' + e.message, true);

                    $('#addTagModal').foundation('reveal', 'close');
                });
            };

            $scope.clearTags = function(event) {
                event.preventDefault();
                var id = $('#__ticketId').text();
                $http.put('/api/v1/tickets/' + id,
                    {
                        "tags": []
                    }
                ).success(function(data) {
                    socket.ui.refreshTicketTags(id);
                    $('#addTagModal').find('option').prop('selected', false);
                    $('#addTagModal').find('select').trigger('chosen:updated');
                    $('#addTagModal').foundation('reveal', 'close');
                }).error(function(e) {
                    console.log('[trudesk:singleTicket:clearTags] - ' + e.message);
                    helpers.showFlash('Error: ' + e.message, true);
                    $('#addTagModal').foundation('reveal', 'close');
                });
            };

            $scope.closeAddTagModal = function() {
                $('#addTagModal').foundation('reveal', 'close');
            };
        })
        .directive('closeMouseUp', ['$document', function($document) {
            return {
                restrict: 'A',
                link: function(scope, element, attr) {
                    $document.off('mouseup', mouseup);
                    $document.on('mouseup', mouseup);

                    function mouseup($event) {
                        var target = $event.target.offsetParent;
                        if ($(target).length > 0 && $(target).hasClass('floating-ticket-status')) return false;

                        if (!element.hasClass('hide')) {
                            element.addClass('hide');
                        }
                    }
                }
            }
        }]);
});