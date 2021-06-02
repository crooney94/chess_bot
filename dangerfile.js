import { message, danger } from 'danger'

const modifiedMD = danger.git.modified_files.join('- ')
message(`changed files in this PR: \n ${JSON.stringify(modifiedMD)}`)