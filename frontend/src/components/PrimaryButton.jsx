import { Button } from '@chakra-ui/react'

/**
 * PrimaryButton Component
 * Reusable primary button with consistent styling
 */
export const PrimaryButton = ({
  children,
  onClick,
  isLoading = false,
  isDisabled = false,
  type = 'button',
  width = 'full',
  ...props
}) => {
  return (
    <Button
      type={type}
      width={width}
      colorScheme="blue"
      size="lg"
      fontSize="md"
      fontWeight="bold"
      onClick={onClick}
      isLoading={isLoading}
      isDisabled={isDisabled || isLoading}
      _hover={{
        bg: 'blue.600',
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
      }}
      _active={{
        transform: 'translateY(0)',
      }}
      transition="all 0.2s"
      {...props}
    >
      {children}
    </Button>
  )
}

export default PrimaryButton
