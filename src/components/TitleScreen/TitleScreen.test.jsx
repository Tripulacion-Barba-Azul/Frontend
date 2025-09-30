import {render, screen} from '@testing-library/react'
import { MemoryRouter } from "react-router-dom";
import '@testing-library/jest-dom';
import TitleScreen from './TitleScreen';

describe('TitleScreen', () => {
    it('Title should render', () =>{
      render(
            <MemoryRouter>
              <TitleScreen />
            </MemoryRouter>
          );
          
      const CGButton = screen.getByText('Create Game')

    });
    it('Button Create Game should render', () =>{
        render(
              <MemoryRouter>
                <TitleScreen />
              </MemoryRouter>
            );

        const CGButton = screen.getByText('Create Game')
        expect(CGButton).toBeInTheDocument();
    })
    it('Button Join Game should render', () =>{
        render(
              <MemoryRouter>
                <TitleScreen />
              </MemoryRouter>
            );

        const JGButton = screen.getByText('Join Game')
        expect(JGButton).toBeInTheDocument();
    })
})