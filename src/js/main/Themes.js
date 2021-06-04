import chroma from 'chroma-js'

export const themes = {
  allIds: ['gibsons', 'sechelt'],
  byId: {

    //------ GIBSONS ------//

    gibsons: {
      name: 'Gibsons',
      id: 'gibsons',
      preferredEditorTheme: 'gambier',
      backgroundComponent: { name: 'SystemWindow', options: {} },
      // baseColorScheme: 'match-app',
      // colorOverrides: [],
    },
    
    //------ SECHELT ------//

    sechelt: {
      name: 'Sechelt',
      id: 'sechelt',
      preferredEditorTheme: 'gambier',
      backgroundComponent: { name: 'Midnight', options: {} },
      // baseColorScheme: 'dark',
      // colorOverrides: [
      //   { 
      //     variable: 'buttonBackgroundColor', 
      //     newValue: '#FFFFFF40',
      //     withMode: 'always',
      //   },
      //   { 
      //     variable: 'controlAccentColor',
      //     newValue: '#3E85F5',
      //     withMode: 'always',
      //   },
      //   { 
      //     variable: 'iconAccentColor',
      //     newValue: '#FFF',
      //     withMode: 'always',
      //   },
      //   { 
      //     variable: 'menuBackgroundColor',
      //     newValue: 'hsla(218, 69%, 20%, 0.95)',
      //     withMode: 'always',
      //   },
      //   { 
      //     variable: 'placeholderTextColor',
      //     newValue: 'hsla(0, 0%, 100%, 0.4)',
      //     withMode: 'always',
      //   },
      //   { 
      //     variable: 'selectedContentBackgroundColor',
      //     newValue: chroma('#3E85F5').darken().hex(),
      //     withMode: 'always',
      //   },
      //   // { // TODO
      //   //   variable: 'selectedTextBackgroundColor',
      //   //   newValue: chroma('#3E85F5').darken().hex(),
      //   //   withMode: 'always',
      //   // },
      // ],
    }
  },
}