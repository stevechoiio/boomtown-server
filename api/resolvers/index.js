/**
 *  @TODO: Handling Server Errors
 *
 *  Once you've completed your pg-resource.js methods and handled errors
 *  use the ApolloError constructor to capture and return errors from your resolvers.
 *
 *  Throwing ApolloErrors from your resolvers is a nice pattern to follow and
 *  will help you easily debug problems in your resolving functions.
 *
 *  It will also help you control th error output of your resource methods and use error
 *  messages on the client! (More on that later).
 *
 *  The user resolver has been completed as an example of what you'll need to do.
 *  Finish of the rest of the resolvers when you're ready.
 */

const { ApolloError } = require('apollo-server-express');

// @TODO: Uncomment these lines later when we add auth
// const jwt = require("jsonwebtoken")
// const authMutations = require("./auth")
// -------------------------------

const { UploadScalar, DateScalar } = require('../custom-types');

module.exports = app => {
  return {
    Upload: UploadScalar,
    Date: DateScalar,

    Query: {
      viewer() {
        /**
         * @TODO: Authentication - Server
         *
         *  If you're here, you have successfully completed the sign-up and login resolvers
         *  and have added the JWT from the HTTP cookie to your resolver's context.
         *
         *  The viewer is what we're calling the current user signed into your application.
         *  When the user signed in with their username and password, an JWT was created with
         *  the user's information cryptographically encoded inside.
         *
         *  To provide information about the user's session to the app, decode and return
         *  the token's stored user here. If there is no token, the user has signed out,
         *  in which case you'll return null
         */
        return null;
      },
      async user(parent, { id }, { pgResource }, info) {
        try {
          const user = await pgResource.getUserById(id);

          return user.rows[0];
        } catch (e) {
          throw new ApolloError(e);
        }
      },
      async items(parent, { filter }, { pgResource }, info) {
        try {
          const item = await pgResource.getItems(filter);

          return item;
        } catch (e) {
          throw new ApolloError(e);
        }
      },
      async tags(parent, { id }, { pgResource }) {
        // @TODO: Replace this mock return statement with the correct tags from Postgres
        try {
          const tag = await pgResource.getTags();
          return tag;
        } catch (e) {
          throw new ApolloError(e);
        }
        // -------------------------------
      }
    },

    User: {
      /**
       *  @TODO: Advanced resolvers
       *
       *  The User GraphQL type has two fields that are not present in the
       *  user table in Postgres: items and borrowed.
       *
       *  According to our GraphQL schema, these fields should return a list of
       *  Items (GraphQL type) the user has lent (items) and borrowed (borrowed).
       *
       */
      // @TODO: Uncomment these lines after you define the User type with these fields
      async items(parent, _, { pgResource }) {
        // @TODO: Replace this mock return statement with the correct items from Postgres
        try {
          const userItem = await pgResource.getItemsForUser(parent.id);

          return userItem;
        } catch (e) {
          throw new ApolloError(e);
        }
      },

      async borrowed(parent, _, { pgResource }, info) {
        try {
          const borrowedItem = await pgResource.getBorrowedItemsForUser(
            parent.id
          );
          return borrowedItem;
        } catch (e) {
          throw new ApolloError(e);
        }
        // @TODO: Replace this mock return statement with the correct items from Postgres
        // -------------------------------
      }
    },

    Item: {
      /**
       *  @TODO: Advanced resolvers
       *
       *  The Item GraphQL type has two fields that are not present in the
       *  Items table in Postgres: itemowner, tags and borrower.
       *
       * According to our GraphQL schema, the itemowner and borrower should return
       * a User (GraphQL type) and tags should return a list of Tags (GraphQL type)
       *
       */
      // @TODO: Uncomment these lines after you define the Item type with these fields
      async itemowner(item, _, { pgResource }) {
        // @TODO: Replace this mock return statement with the correct user from Postgres
        try {
          const itemOwner = await pgResource.getUserById(item.ownerid);
          console.log(itemOwner);
          return itemOwner.rows[0];
        } catch (e) {
          throw new ApolloError(`itemowner error : ${e}`);
        }
      },
      async tags(item, _, { pgResource }) {
        // @TODO: Replace this mock return statement with the correct tags for the queried Item from Postgres
        try {
          const itemTags = await pgResource.getTagsForItem(item.id);

          return itemTags;
        } catch (e) {
          throw 'unable to get tags from the item';
        }
      },
      async borrower(item, _, { pgResource }) {
        try {
          const borrower = await pgResource.getUserById(item.borrowerid);

          return borrower.rows[0];
        } catch (e) {
          throw 'unable to fetch the borrower from the items';
        }
      },
      async imageurl({ imageurl, imageid, mimetype, data }) {
        if (imageurl) return imageurl;
        if (imageid) {
          return `data:${mimetype};base64, ${data}`;
        }
      }
    },

    Mutation: {
      // @TODO: Uncomment this later when we add auth
      // ...authMutations(app),
      // -------------------------------

      async addItem(parent, { item }, { pgResource, token }, info) {
        try {
          // const image = await image;
          // const user = await jwt.decode(token, app.get('JWT_SECRET'));
          const user = { id: 3 };
          const newItem = await pgResource.saveNewItem({
            item,
            user
          });
          console.log(newItem.rows[0]);
          return newItem.rows[0];
        } catch (e) {
          throw 'unable to add new Item';
        }
      }
    }
  };
};
