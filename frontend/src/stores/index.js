import UserStore from './UserStore'
import PostStore from './PostStore'
import ProfileStore from './ProfileStore'
import LoginStore from './LoginStore'
import HomeStore from './HomeStore'
import NotificationStore from './NotificationStore'
import SuggestionStore from './SuggestionStore'

class RootStore {
  constructor() {
    this.userStore = new UserStore()
    this.postStore = new PostStore()
    this.profileStore = new ProfileStore()
    this.loginStore = new LoginStore()
    this.homeStore = new HomeStore()
    this.notificationStore = new NotificationStore()
    this.suggestionStore = new SuggestionStore()
  }
}

const rootStore = new RootStore()

export const userStore = rootStore.userStore
export const postStore = rootStore.postStore
export const profileStore = rootStore.profileStore
export const loginStore = rootStore.loginStore
export const homeStore = rootStore.homeStore
export const notificationStore = rootStore.notificationStore
export const suggestionStore = rootStore.suggestionStore

export default rootStore