// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock window.scrollTo
global.scrollTo = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock styled-components
jest.mock('styled-components', () => {
  const React = require('react');
  
  const createStyledComponent = (tag) => {
    const component = (strings, ...interpolations) => {
      const StyledComponent = React.forwardRef((props, ref) => {
        const { children, className, onClick, disabled, as, ...rest } = props;
        const Tag = as || (typeof tag === 'string' ? tag : 'div');
        return React.createElement(Tag, { 
          className, 
          onClick, 
          disabled,
          ref,
          ...rest 
        }, children);
      });

      // Add withConfig method for generic type support
      StyledComponent.withConfig = () => StyledComponent;
      
      return StyledComponent;
    };
    
    // Add withConfig to the base function too
    component.withConfig = () => component;
    
    return component;
  };

  const styled = createStyledComponent;

  // Add common HTML tags
  styled.div = createStyledComponent('div');
  styled.section = createStyledComponent('section');
  styled.header = createStyledComponent('header');
  styled.nav = createStyledComponent('nav');
  styled.button = createStyledComponent('button');
  styled.h1 = createStyledComponent('h1');
  styled.h2 = createStyledComponent('h2');
  styled.h3 = createStyledComponent('h3');
  styled.h4 = createStyledComponent('h4');
  styled.h5 = createStyledComponent('h5');
  styled.h6 = createStyledComponent('h6');
  styled.p = createStyledComponent('p');
  styled.span = createStyledComponent('span');
  styled.a = createStyledComponent('a');
  styled.img = createStyledComponent('img');
  styled.ul = createStyledComponent('ul');
  styled.li = createStyledComponent('li');
  styled.article = createStyledComponent('article');
  styled.aside = createStyledComponent('aside');
  styled.footer = createStyledComponent('footer');
  styled.main = createStyledComponent('main');
  styled.form = createStyledComponent('form');
  styled.input = createStyledComponent('input');
  styled.textarea = createStyledComponent('textarea');
  styled.label = createStyledComponent('label');

  return {
    __esModule: true,
    default: styled,
    createGlobalStyle: () => {
      const GlobalStyle = () => null;
      return GlobalStyle;
    },
  };
});
