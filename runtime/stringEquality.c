#include <string.h>

int _c_isStringEqual(int* l, int* r)
{
    if (strcmp(l, r) == 0)
    {
        return 1;
    }
    else
    {
        return 0;
    }
}
