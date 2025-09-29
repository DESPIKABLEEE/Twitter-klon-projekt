import UserStore from './UserStore'
import PostStore from './PostStore'
import ProfileStore from './ProfileStore'
import LoginStore from './LoginStore'
import HomeStore from './HomeStore'

class RootStore {
  constructor() {
    this.userStore = new UserStore()
    this.postStore = new PostStore()
    this.profileStore = new ProfileStore()
    this.loginStore = new LoginStore()
    this.homeStore = new HomeStore()
  }
}

const rootStore = new RootStore()

export const userStore = rootStore.userStore
export const postStore = rootStore.postStore
export const profileStore = rootStore.profileStore
export const loginStore = rootStore.loginStore
export const homeStore = rootStore.homeStore

export default rootStore