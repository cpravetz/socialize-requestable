/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';
import SimpleSchema from 'simpl-schema';
import { LinkableModel, LinkParent } from 'socialize:linkable-model';

/* eslint-disable import/no-unresolved */

export const RequestsCollection = new Mongo.Collection('requests');

const acceptHooks = {};
let requestTypes = [];
/**
 * The Request Class
 * @class Request
 * @param {Object} document An object representing a request, usually a Mongo document
 */
export class Request extends LinkableModel {
    /**
     * onAccepted - Register a function to run when the request is accepted
     *
     * @static
     * @param  {LinkParent} model       The model for which the function should run
     * @param  {Function} acceptedHook  The function to run when the request is accepted
     * @throws {Meteor.error}
     */

    static onAccepted(model, acceptedHook) {
        if (model instanceof LinkParent) {
            if (_.isFunction(acceptedHook)) {
                const hookName = model.prototype.getCollectionName();

                if (!acceptHooks[hookName]) {
                    acceptHooks[hookName] = [];
                }

                acceptHooks[hookName].push(acceptedHook);
            } else {
                throw new Meteor.Error('notAFunction', 'Second parameter of onAccepted must be a function');
            }
        } else {
            throw new Meteor.Error('notALinkParent', 'First parameter of onAccepted must be a model of type LinkParent');
        }
    }

    static registerRequestType(type) {
        // create a set from the requestTypes array so we only add unique values
        const typesSet = new Set(requestTypes);

        typesSet.add(type);

        requestTypes = Array.from(typesSet);
    }

    /**
     * Get the User instance for the user who made the request
     * @returns {User} The user who made the request
     */
    requester() {
        return Meteor.users.findOne(this.requesterId);
    }

    /**
     * Accept the friend request
     * @method approve
     */
    accept() {
        _.each(acceptHooks[this.objectType], (hook) => {
            hook.call(this);
        });
    }

    /**
     * Deny the friend request
     * @method deny
     */
    deny() {
        this.update({ $set: { denied: new Date() } });
    }

    /**
     * Ignore the friend request so that it can be accpted or denied later
     * @method ignore
     */
    ignore() {
        this.update({ $set: { ignored: new Date() } });
    }

    /**
     * Cancel the friend request
     * @method cancel
     */
    cancel() {
        this.remove();
    }

    /**
     * Check if the request had been responded to
     * @returns {Boolean} Whether the request has been responded to
     */
    wasRespondedTo() {
        return !!this.denied || !!this.ignored;
    }
}

Request.attachCollection(RequestsCollection);


// Create the schema for a request
RequestsCollection.attachSchema(new SimpleSchema({
    requesterId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        autoValue() {
            if (this.isInsert) {
                return Meteor.userId();
            }
            return undefined;
        },
        denyUpdate: true,
    },
    type: {
        type: String,
        allowedValues: requestTypes,
    },
    date: {
        type: Date,
        autoValue() {
            if (this.isInsert) {
                return new Date();
            }
            return undefined;
        },
        denyUpdate: true,
    },
    denied: {
        type: Date,
        optional: true,
    },
    ignored: {
        type: Date,
        optional: true,
    },
}));

// add the LinkableSchema to the request class
Request.appendSchema(LinkableModel.LinkableSchema);
