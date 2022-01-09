const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')

const mongoose = require('mongoose')

const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const MONGODB_URI = 'mongodb+srv://user:hundert@cluster0.ky3f3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

const jwt = require('jsonwebtoken')
const JWT_SECRET = 'adjDJWIhgfAJDggIWiwadja'


console.log('connecting to', MONGODB_URI)
// I have added { useNewUrlParser: true } because console said so, useUnifiedTopology: true 
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })



const typeDefs = gql`

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: Author # this used to be String!
    id: ID!
    genres: [String!]!
  }


  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]! #ex8.2 8.4 8.5
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      name: String!
      published: Int!
      genres: [String!]!
    ): Book

    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author

    createUser(
      username: String!
      # favoriteGenre: String!
    ): User

    login(
      username: String!
      password: String!
    ): Token

  }
` //end typeDefs


// number of authors:   const authorlist = await Author.collection.countDocuments()

const resolvers = {
  Query: {
    // ex 8.16
    me: (root, args, context) => {
      return context.currentUser
    },


    // ex8.3
    allAuthors: async () => {
      const authorlist = await Author.find({})
      console.log(authorlist)
      return authorlist
    },

    // ex8.2, 8.5 genre
    allBooks: async (root, args) => {
      if (args.author) {
        const booklist = await Book.find({})
        console.log("booklist", booklist)
        return Book.find({ author: { name: args.author } })
      }
      const booklist = await Book.find({})
      console.log("booklist", booklist)
      return Book.find({}).populate('author') // woohoo this solved the query
    },


    // ex8.14
    bookCount: async () => await Book.collection.countDocuments(),
    authorCount: async () => await Author.collection.countDocuments(),
  },

  // ex 8.3, where name of the author matches we push it into array and count number of books in there
  Author: {
    bookCount: (root, args) => {
      const booksByAuthor = []

      books.forEach(e => {
        if (e.author === root.name) {
          booksByAuthor.push(e.title)
        }
      })
      return booksByAuthor.length
    }
  },

  // 8.6
  Mutation: {
    addBook: async (root, args, context) => {
      // ex 8.16
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      //ex 8.15
      if (args.title.length < 3) {
        throw new UserInputError("Book title WAAAAY too short!")
        return
      }
      if (args.name.length < 5) {
        throw new UserInputError("Author name WAAAAY too short!")
        return
      }

      const book = new Book({ ...args })
      const findAuthor = await Author.findOne({ name: args.name }) // if author not in DB 
      if (findAuthor) { // if author exists, we set book.author field to that author object
        book.author = findAuthor
      }


      try {
        if (!findAuthor) {      // if author does not exist then we save him to DB and to the book too
          const author = new Author({ name: args.name })
          const returnedAuthor = await author.save()
          book.author = returnedAuthor
        }
        await book.save()

      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      return book
    },

    
    // ex 8.7
    editAuthor: (root, args, context) => {
      if (!args.name) { return null }

      const currentUser = context.currentUser
      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      const filteredAuthors = authors.filter(e => e.name !== args.name)
      const authorInQ = authors.find(e => e.name === args.name)
      authorInQ.born = args.setBornTo
      console.log(filteredAuthors.concat(authorInQ))
      return authorInQ
    },


    // 8.16
    createUser: async (root, args) => {
      const user = new User({ username: args.username })

      try {
        await user.save()
      } catch (error) {
        throw new UserInputError(error.message, { invalidArgs: args })
      }
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new UserInputError("wrong credentials")
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },

  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id).populate()
      return { currentUser }
    }
  },

})

server.listen(5000).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})