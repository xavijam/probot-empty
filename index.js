const { size, extend, isEmpty, template } = require('lodash')
const getConfig = require('probot-config')
const emptyCommit = require('make-empty-github-commit')

const NO_CONFIG = 'Hey, if `.config/probot-empty.yaml` file is not present in the repository, I won\'t be able to do anything'
const ERROR = 'Ouch, there was a problem pushing the empty commit, please contact xavijam@gmail.com'
const botName = 'probot-empty[bot]'

module.exports = app => {
  app.log('Probot loaded!')

  app.on('issue_comment.created', async context => {
    const { github, payload } = context
    const isPR = !!payload.issue.pull_request
    const comment = payload.comment
    const user = comment.user
    const commentBody = comment.body && comment.body.toLowerCase()
    const userName = user.login
    const isBot = user.type === 'Bot'
    const issueNumber = payload.issue.number

    const prResult = await github.pullRequests.get(
      extend(
        context.repo(),
        {
          number: issueNumber
        }
      )
    )

    const branch = prResult.data.head.ref

    // Let's not make anything if it is our Bot 😬
    if (userName === botName && isBot) {
      return
    }

    // Check if it is a PR
    if (!isPR) {
      return
    }

    // Check config
    const config = await getConfig(context, 'probot-empty.yaml') || {}
    const magicWords = config.magicWords

    if (isEmpty(config)) {
      return context.github.issues.createComment(
        context.issue({ body: NO_CONFIG })
      )
    }

    // Check magic words
    if (commentBody.search(magicWords) > 0) {
      const compiled = template(config.messages.exact)
      const params = context.issue({ body: compiled({ magicWords }) })
      return context.github.issues.createComment(params)
    } else if (commentBody.search(magicWords) < 0) {
      return
    }

    // Check requiredFiles
    if (config.requiredFiles) {
      let missingFiles = []
      for (const path of config.requiredFiles) {
        await github.repos.getContent(
          context.repo({ path })
        ).catch(e => {
          missingFiles.push(path)
        })
      }

      if (size(missingFiles) > 0) {
        const compiled = template(config.messages.fileNotPresent)
        const params = context.issue({ body: compiled({ files: missingFiles.join(', ') }) })
        return context.github.issues.createComment(params)
      }
    }

    // Push empty commit
    const result = await emptyCommit(
      extend(
        context.repo(),
        {
          github,
          branch,
          message: config.messages.commit
        }
      )
    ).catch(e => {
      return context.github.issues.createComment(
        context.issue({ body: ERROR })
      )
    })

    if (!result) {
      return
    }

    // Comment
    const params = context.issue({ body: config.messages.trigger })
    return context.github.issues.createComment(params)
  })

  app.on('pull_request.opened', async context => {
    const { github, payload } = context

    // Check config
    const config = await getConfig(context, 'probot-empty.yaml') ||  {}
    const magicWords = config.magicWords

    if (isEmpty(config)) {
      return context.github.issues.createComment(
        context.issue({ body: NO_CONFIG })
      )
    }

    let compiled = template(config.messages.appDisabled)
    let params

    // Check requiredFiles
    if (config.requiredFiles) {
      let missingFiles = []
      for (const path of config.requiredFiles) {
        await github.repos.getContent(
          context.repo({ path })
        ).catch(e => {
          missingFiles.push(path)
        })
      }

      if (size(missingFiles) > 0) {
        params = context.issue({ body: compiled({ files: missingFiles.join(', ') }) })
        return context.github.issues.createComment(params)
      }
    }

    compiled = template(config.messages.appEnabled)
    params = context.issue({ body: compiled({ magicWords: config.magicWords }) })
    return context.github.issues.createComment(params)
  })
}
