#!/usr/bin/python3

import sys

csvfile = sys.argv[1]
name = csvfile.split('.')[0]

f = open(csvfile,'r')

header = f.readline()[:-1]
print(f'// imported from {csvfile} header: {header}')
print(f'var {name} = [')

header = header.split(';')
total = []
for line in f:
    arr = line[:-1].split(';')
    obj = {}
    if len(arr)!=len(header):
        print('Warning: broken line', arr)
    for i,key in enumerate(header):
        obj[key] = arr[i]
    total.append(obj)

print(*total, sep=',\n',end='];\n')

f.close()
