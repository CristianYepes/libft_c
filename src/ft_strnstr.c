/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strnstr.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cristian <cristian@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/09/28 19:47:59 by cristian          #+#    #+#             */
/*   Updated: 2024/10/12 13:52:52 by cristian         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

char	*ft_strnstr(const char *big, const char *little, size_t len)
{
	size_t	h;
	size_t	n;

	h = 0;
	if (little[0] == '\0')
		return ((char *)big);
	while (big[h] && h < len)
	{
		n = 0;
		while (big[h + n] == little[n] && (h + n) < len)
		{
			if (little[n +1] == '\0')
				return ((char *)&big[h]);
			n++;
		}
		h++;
	}
	return (0);
}
