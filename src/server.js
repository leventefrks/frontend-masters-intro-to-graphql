import { ApolloServer } from 'apollo-server'
import { loadTypeSchema } from './utils/schema'
import { authenticate } from './utils/auth'
import { merge } from 'lodash'
import config from './config'
import { connect } from './db'
import product from './types/product/product.resolvers'
import coupon from './types/coupon/coupon.resolvers'
import user from './types/user/user.resolvers'

const types = ['product', 'coupon', 'user']

export const start = async () => {
  const rootSchema = `
    type Cat {
      name: String,
      age: Int!,
      nickName: String!
      bestFriend: [Cat]
    }

    type _Query {
      myCat: Cat,
      hello: String
    }

    schema {
      query: _Query
      mutation: Mutation
    }
  `
  const schemaTypes = await Promise.all(types.map(loadTypeSchema))

  const server = new ApolloServer({
    typeDefs: [rootSchema, ...schemaTypes],
    resolvers: merge(
      {
        _Query: {
          myCat() {
            return { name: 'Garfield', age: 28, nickName: 'little kitty' }
          },

          hello() {
            return 'hello GraphQl'
          }
        }
      },
      product,
      coupon,
      user
    ),
    async context({ req }) {
      const user = await authenticate(req)
      return { user }
    }
  })

  await connect(config.dbUrl)
  const { url } = await server.listen({ port: config.port })

  console.log(`GQL server ready at ${url}`)
}
