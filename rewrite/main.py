import pygame


def main():
    pygame.init()
    screen = pygame.display.set_mode((1280, 720), pygame.FULLSCREEN)
    clock = pygame.time.Clock()
    running = True

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False

        screen.fill("gray")

        pygame.display.flip()

        clock.tick(60)  # limits FPS to 60


pygame.quit()

if __name__ == "__main__":
    main()
